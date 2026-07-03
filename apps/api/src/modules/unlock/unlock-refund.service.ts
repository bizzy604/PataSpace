/**
 * Purpose: Unlock refund engine: system refunds on listing invalidation,
 * dispute-driven refunds, and reason-coded refunds from report-dead.
 * Refunds are synchronous credits, never chased (spec section 2/4.2).
 * Why important: automatic refunds ARE the trust product; every refund also
 * expires the masked contact session and cancels unpaid commissions.
 * Used by: ReportDeadService, DisputeService, UnlockService delegation.
 */
import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  SuccessFeeStatus,
  TransactionStatus,
  UnlockDeadReason as PrismaUnlockDeadReason,
} from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { decryptField } from '../../common/security/encryption.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { CreditService } from '../credit/credit.service';
import { ListingCacheService } from '../listing/listing-cache.service';
import { ProxySessionService } from './contact/proxy-session.service';
import { mergeTransactionMetadata } from './unlock.util';

export type DeadReport = {
  deadReason: PrismaUnlockDeadReason;
  comment?: string;
};

@Injectable()
export class UnlockRefundService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly listingCacheService: ListingCacheService,
    private readonly proxySessionService: ProxySessionService,
    private readonly smsService: SmsService,
    configService: ConfigService,
  ) {
    this.encryptionKey = configService.get<string>('security.encryptionKey') ?? '';
  }

  async refundUnlocksForListingInvalidation(listingId: string, reason: string) {
    const unlocks = await this.prismaService.unlock.findMany({
      where: {
        listingId,
        isRefunded: false,
      },
      select: {
        id: true,
      },
    });

    for (const unlock of unlocks) {
      await this.refundUnlock(unlock.id, reason);
    }

    if (unlocks.length > 0) {
      await this.listingCacheService.invalidateListing(listingId);
    }
  }

  async refundUnlockById(unlockId: string, reason: string) {
    await this.refundUnlock(unlockId, reason);
  }

  async refundUnlock(unlockId: string, reason: string, deadReport?: DeadReport) {
    let buyerId: string | null = null;
    let buyerPhoneNumber: string | null = null;
    let listingId: string | null = null;

    await this.prismaService.$transaction(async (db) => {
      const unlock = await db.unlock.findUnique({
        where: {
          id: unlockId,
        },
        include: {
          creditTransaction: {
            select: {
              id: true,
              metadata: true,
              status: true,
            },
          },
          commission: {
            select: {
              id: true,
              status: true,
            },
          },
          buyer: {
            select: {
              phoneNumberEncrypted: true,
            },
          },
        },
      });

      if (!unlock || unlock.isRefunded) {
        return;
      }

      if (unlock.commission?.status === CommissionStatus.PAID) {
        throw new ConflictException({
          code: 'COMMISSION_ALREADY_PAID',
          message: 'Cannot refund an unlock after the commission has already been paid',
        });
      }

      const refundResult = await this.creditService.refundCredits(db, {
        userId: unlock.buyerId,
        amount: unlock.creditsSpent,
        description: `Refund for invalid listing ${unlock.listingId}`,
        metadata: {
          listingId: unlock.listingId,
          reason,
          unlockId: unlock.id,
          ...(deadReport
            ? {
                deadReason: deadReport.deadReason,
                reporterComment: deadReport.comment ?? null,
              }
            : {}),
        },
      });

      await db.unlock.update({
        where: {
          id: unlock.id,
        },
        data: {
          isRefunded: true,
          refundReason: reason,
          refundedAt: new Date(),
          deadReason: deadReport?.deadReason ?? null,
        },
      });

      await this.proxySessionService.expireForUnlock(db, unlock.id);

      // A refunded unlock owes no success fee; deleting the unsettled row
      // also lifts the mover's account gating. Settled fees stay for the
      // admin dispute flow to adjudicate.
      await db.successFee.deleteMany({
        where: {
          unlockId: unlock.id,
          status: {
            not: SuccessFeeStatus.SETTLED,
          },
        },
      });

      if (unlock.creditTransaction) {
        await db.creditTransaction.update({
          where: {
            id: unlock.creditTransaction.id,
          },
          data: {
            status: TransactionStatus.REFUNDED,
            metadata: mergeTransactionMetadata(unlock.creditTransaction.metadata, {
              refundedAt: new Date().toISOString(),
              refundReason: reason,
              refundTransactionId: refundResult.transaction.id,
            }),
          },
        });
      }

      if (
        unlock.commission &&
        unlock.commission.status !== CommissionStatus.CANCELLED
      ) {
        await db.commission.update({
          where: {
            id: unlock.commission.id,
          },
          data: {
            status: CommissionStatus.CANCELLED,
            lastAttemptError: `Cancelled because unlock ${unlock.id} was refunded: ${reason}`,
          },
        });
      }

      buyerId = unlock.buyerId;
      buyerPhoneNumber = unlock.buyer.phoneNumberEncrypted
        ? decryptField(unlock.buyer.phoneNumberEncrypted, this.encryptionKey)
        : null;
      listingId = unlock.listingId;
    });

    if (!buyerId) {
      return;
    }

    await this.creditService.invalidateBalanceCache(buyerId);

    if (listingId) {
      await this.listingCacheService.invalidateListing(listingId);
    }

    if (buyerPhoneNumber) {
      try {
        await this.smsService.sendMessage(
          buyerPhoneNumber,
          `Your unlock has been refunded on PataSpace. Reason: ${reason}`,
        );
      } catch {
        return;
      }
    }
  }
}

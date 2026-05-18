/**
 * Purpose: Handles the outcome side of any credit purchase — awarding credits on success,
 *          marking failure, and sending SMS — independent of the payment rail used.
 * Why important: Single authoritative place for credit-awarding logic shared by M-Pesa and Stellar.
 * Used by: mpesa-purchase.service.ts, stellar-purchase.service.ts
 */

import { Injectable } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { CreditService } from '../credit/credit.service';
import { UserService } from '../user/user.service';
import { mergeMetadata, readNumberMetadata, readStringMetadata } from './payment-metadata.util';

export type PaymentSettlementRecord = {
  amountPaid: number | null;
  phoneNumber?: string | null;
  phoneNumberHash?: string | null;
  mpesaReceiptNumber?: string | null;
  mpesaCheckoutRequestId?: string | null;
  merchantRequestId?: string | null;
  stellarTransactionHash?: string | null;
  resultDesc?: string;
};

const CANCELLED_RESULT_CODES = new Set([1032, 2032]);

@Injectable()
export class PaymentFulfillmentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    private readonly userService: UserService,
    private readonly smsService: SmsService,
  ) {}

  async processSuccessfulPayment(transactionId: string, record: PaymentSettlementRecord) {
    let notificationUserId: string | null = null;
    let notificationPhone = record.phoneNumber ?? null;
    let creditsGranted = 0;

    await this.prismaService.$transaction(async (db) => {
      const tx = await db.creditTransaction.findUnique({ where: { id: transactionId } });
      if (!tx || tx.status !== TransactionStatus.PENDING) return;

      const claimed = await db.creditTransaction.updateMany({
        where: { id: transactionId, status: TransactionStatus.PENDING },
        data: { status: TransactionStatus.COMPLETED },
      });
      if (claimed.count === 0) return;

      const expectedAmount = readNumberMetadata(tx.metadata, 'paymentAmountKES');
      if (expectedAmount !== null && record.amountPaid !== null && expectedAmount !== record.amountPaid) {
        await db.creditTransaction.update({
          where: { id: tx.id },
          data: {
            status: TransactionStatus.FAILED,
            metadata: mergeMetadata(tx.metadata, {
              failureReason: `Amount mismatch. Expected ${expectedAmount}, got ${record.amountPaid}.`,
              settlementRecord: record,
              settledAt: new Date().toISOString(),
            }),
          },
        });
        return;
      }

      creditsGranted = tx.amount;
      const balance = await this.creditService.applyBalanceIncrement(db, {
        userId: tx.userId,
        amount: tx.amount,
        lifetimeEarnedDelta: tx.amount,
      });

      await db.creditTransaction.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.COMPLETED,
          balanceBefore: balance.balanceBefore,
          balanceAfter: balance.balanceAfter,
          ...(record.phoneNumberHash ? { phoneNumberHash: record.phoneNumberHash } : {}),
          ...(record.mpesaReceiptNumber ? { mpesaReceiptNumber: record.mpesaReceiptNumber } : {}),
          ...(record.mpesaCheckoutRequestId ? { mpesaTransactionId: record.mpesaCheckoutRequestId } : {}),
          ...(record.stellarTransactionHash ? { stellarTransactionHash: record.stellarTransactionHash } : {}),
          metadata: mergeMetadata(tx.metadata, { settlementRecord: record, settledAt: new Date().toISOString() }),
        },
      });

      notificationUserId = tx.userId;
    });

    if (!notificationUserId) return;

    await this.creditService.invalidateBalanceCache(notificationUserId);

    if (!notificationPhone) {
      const user = await this.userService.findStoredById(notificationUserId);
      notificationPhone = user?.phoneNumberEncrypted
        ? this.userService.decryptPhoneNumber(user.phoneNumberEncrypted)
        : null;
    }

    if (notificationPhone) {
      await this.sendSmsQuietly(
        notificationPhone,
        `Your PataSpace balance has been credited with ${creditsGranted} credits.`,
      );
    }
  }

  async processFailedPayment(
    transactionId: string,
    resultCode: number,
    resultDesc: string,
    record?: Partial<PaymentSettlementRecord>,
  ) {
    let notificationPhone = record?.phoneNumber ?? null;

    await this.prismaService.$transaction(async (db) => {
      const tx = await db.creditTransaction.findUnique({ where: { id: transactionId } });
      if (!tx || tx.status !== TransactionStatus.PENDING) return;

      const mappedStatus = CANCELLED_RESULT_CODES.has(resultCode)
        ? TransactionStatus.CANCELLED
        : TransactionStatus.FAILED;

      const claimed = await db.creditTransaction.updateMany({
        where: { id: transactionId, status: TransactionStatus.PENDING },
        data: { status: mappedStatus },
      });
      if (claimed.count === 0) return;

      await db.creditTransaction.update({
        where: { id: tx.id },
        data: {
          status: mappedStatus,
          ...(record?.phoneNumberHash ? { phoneNumberHash: record.phoneNumberHash } : {}),
          metadata: mergeMetadata(tx.metadata, { resultCode, resultDesc, failedAt: new Date().toISOString(), ...(record ?? {}) }),
        },
      });

      if (!notificationPhone) {
        notificationPhone = readStringMetadata(tx.metadata, 'requestedPhoneNumber') ?? null;
      }
    });

    if (notificationPhone) {
      await this.sendSmsQuietly(notificationPhone, `Your PataSpace credit purchase failed: ${resultDesc}`);
    }
  }

  async findPurchaseTransactionByLookup(lookupId: string, receiptNumber?: string | null) {
    return this.prismaService.creditTransaction.findFirst({
      where: {
        OR: [
          { mpesaTransactionId: lookupId },
          ...(receiptNumber ? [{ mpesaReceiptNumber: receiptNumber }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    });
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }
}

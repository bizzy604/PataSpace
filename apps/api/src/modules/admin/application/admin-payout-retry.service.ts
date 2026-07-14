/**
 * Purpose: Requeues a FAILED (dead-lettered) commission payout and drives one
 *   immediate send so the operator sees the outcome instead of waiting for the
 *   daily sweep.
 * Why important: This touches real shillings. It flips FAILED to DUE WITHOUT
 *   resetting paymentAttempts, so the processor's confirm-before-resend guard
 *   still fires and a prior accepted B2C can never become a second payout.
 * Used by: AdminFinanceController (modules/admin).
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, Prisma } from '@prisma/client';
import {
  AdminRetryPayoutResponse,
  CommissionStatus as ContractCommissionStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  CommissionPayoutProcessor,
  PayoutCandidate,
} from '../../../jobs/commission-payout.processor';

@Injectable()
export class AdminPayoutRetryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly processor: CommissionPayoutProcessor,
  ) {}

  async retry(adminId: string, commissionId: string, now = new Date()): Promise<AdminRetryPayoutResponse> {
    const commission = await this.prismaService.commission.findUnique({
      where: { id: commissionId },
      include: {
        unlock: {
          include: {
            dispute: { select: { status: true } },
            listing: {
              select: {
                id: true,
                neighborhood: true,
                user: { select: { phoneNumberEncrypted: true } },
              },
            },
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    if (commission.status !== CommissionStatus.FAILED) {
      throw new ConflictException('Only failed payouts can be retried');
    }

    // Claim-guarded flip: if a callback or another operator already moved the
    // row, count is 0 and we refuse rather than double-handle it.
    const claimed = await this.prismaService.commission.updateMany({
      where: { id: commissionId, status: CommissionStatus.FAILED },
      data: { status: CommissionStatus.DUE, lastAttemptError: null },
    });
    if (claimed.count === 0) {
      throw new ConflictException('Payout is no longer in a failed state');
    }

    await this.recordRetryAudit(adminId, commission);

    const candidate: PayoutCandidate = {
      id: commission.id,
      unlockId: commission.unlockId,
      amountKES: commission.amountKES,
      paymentAttempts: commission.paymentAttempts,
      originatorConversationId: commission.originatorConversationId,
      unlock: {
        dispute: commission.unlock.dispute,
        listing: commission.unlock.listing,
      },
    };

    const outcome = await this.processor.process(candidate, now);
    const after = await this.prismaService.commission.findUnique({
      where: { id: commissionId },
      select: { status: true },
    });

    return {
      commissionId,
      outcome,
      status: (after?.status ?? CommissionStatus.DUE) as unknown as ContractCommissionStatus,
    };
  }

  private async recordRetryAudit(
    adminId: string,
    commission: { id: string; amountKES: number; paymentAttempts: number; unlock: { listing: { id: string } } },
  ) {
    await this.prismaService.auditLog.create({
      data: {
        userId: adminId,
        action: 'commission.payout_retried',
        entityType: 'Commission',
        entityId: commission.id,
        oldValue: { status: CommissionStatus.FAILED } satisfies Prisma.InputJsonObject,
        newValue: { status: CommissionStatus.DUE } satisfies Prisma.InputJsonObject,
        metadata: {
          amountKES: commission.amountKES,
          priorAttempts: commission.paymentAttempts,
          listingId: commission.unlock.listing.id,
        } satisfies Prisma.InputJsonObject,
      },
    });
  }
}

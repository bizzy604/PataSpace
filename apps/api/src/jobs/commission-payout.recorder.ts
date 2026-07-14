/**
 * Purpose: All commission payout record-keeping: claim-guarded status
 * transitions (PAID, FAILED, DUE), submission bookkeeping, and audit rows.
 * Why important: every write here is claim-based so a settlement result
 * arriving via the B2C callback can never be overwritten by the job (and
 * vice versa) — the first writer wins, the loser becomes a no-op.
 * Used by: commission-payout.processor.ts, commission-payout.job.ts.
 */
import { Injectable } from '@nestjs/common';
import { CommissionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

export const SETTLEMENT_OVERDUE_NOTE =
  'Settlement result overdue (no B2C result callback); investigate with Safaricom';

export const DUPLICATE_SUBMISSION_NOTE =
  'Duplicate B2C submission detected; awaiting the original settlement result';

export type PayoutRecordTarget = {
  id: string;
  amountKES: number;
  unlock: { listing: { id: string; neighborhood: string } };
};

const UNSETTLED = [CommissionStatus.PROCESSING, CommissionStatus.DUE] as const;

@Injectable()
export class CommissionPayoutRecorder {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Records that Safaricom ACCEPTED the request. Acceptance is not
   * settlement: status stays PROCESSING until the result callback (or a
   * confirmed status query) decides PAID or FAILED.
   */
  async recordSubmission(
    commissionId: string,
    conversationId: string | undefined,
    attempts: number,
    now: Date,
  ) {
    await this.prismaService.commission.updateMany({
      where: { id: commissionId, status: CommissionStatus.PROCESSING },
      data: {
        ...(conversationId ? { mpesaTransactionId: conversationId } : {}),
        paymentAttempts: attempts,
        lastAttemptAt: now,
        lastAttemptError: null,
      },
    });
  }

  async recordDuplicateSubmission(commissionId: string, attempts: number, now: Date) {
    await this.prismaService.commission.updateMany({
      where: { id: commissionId, status: CommissionStatus.PROCESSING },
      data: {
        paymentAttempts: attempts,
        lastAttemptAt: now,
        lastAttemptError: DUPLICATE_SUBMISSION_NOTE,
      },
    });
  }

  /** Returns false when a callback already settled the row (no-op). */
  async markPaid(
    commission: PayoutRecordTarget,
    originatorConversationId: string,
    now: Date,
    payout: { conversationId?: string; mpesaReceiptNumber?: string },
  ): Promise<boolean> {
    return this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.commission.updateMany({
        where: { id: commission.id, status: { in: [...UNSETTLED] } },
        data: {
          status: CommissionStatus.PAID,
          paidAt: now,
          mpesaTransactionId: payout.conversationId ?? originatorConversationId,
          mpesaReceiptNumber: payout.mpesaReceiptNumber ?? undefined,
          lastAttemptAt: now,
          lastAttemptError: null,
        },
      });

      if (claimed.count === 0) {
        return false;
      }

      await tx.auditLog.create({
        data: {
          action: 'commission.paid',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            conversationId: payout.conversationId ?? null,
            mpesaReceiptNumber: payout.mpesaReceiptNumber ?? null,
            originatorConversationId,
            neighborhood: commission.unlock.listing.neighborhood,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return true;
    });
  }

  /** Returns false when a callback already settled the row (no-op). */
  async markDeadLettered(
    commission: PayoutRecordTarget,
    reason: string,
    attempts: number,
    now: Date,
  ): Promise<boolean> {
    return this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.commission.updateMany({
        where: { id: commission.id, status: { in: [...UNSETTLED] } },
        data: {
          status: CommissionStatus.FAILED,
          paymentAttempts: attempts,
          lastAttemptAt: now,
          lastAttemptError: reason,
        },
      });

      if (claimed.count === 0) {
        return false;
      }

      await tx.auditLog.create({
        data: {
          action: 'commission.dead_lettered',
          entityType: 'Commission',
          entityId: commission.id,
          metadata: {
            amountKES: commission.amountKES,
            error: reason,
            listingId: commission.unlock.listing.id,
            paymentAttempts: attempts,
          } satisfies Prisma.InputJsonObject,
        },
      });

      return true;
    });
  }

  async recordRetryFailure(
    commissionId: string,
    attempts: number,
    errorMessage: string,
    now: Date,
  ) {
    await this.prismaService.commission.updateMany({
      where: { id: commissionId, status: CommissionStatus.PROCESSING },
      data: {
        status: CommissionStatus.DUE,
        paymentAttempts: attempts,
        lastAttemptAt: now,
        lastAttemptError: errorMessage,
      },
    });
  }

  /**
   * Ops flag for submitted payouts whose settlement result never arrived.
   * Status is left untouched: the money may have moved, so only a human
   * (or a future reconciliation job) may decide PAID or FAILED.
   */
  async flagSettlementOverdue(
    commissions: Array<{ id: string; amountKES: number; mpesaTransactionId: string | null; originatorConversationId: string | null; lastAttemptAt: Date | null }>,
  ) {
    for (const commission of commissions) {
      await this.prismaService.$transaction(async (tx) => {
        await tx.commission.update({
          where: { id: commission.id },
          data: { lastAttemptError: SETTLEMENT_OVERDUE_NOTE },
        });

        await tx.auditLog.create({
          data: {
            action: 'commission.settlement_overdue',
            entityType: 'Commission',
            entityId: commission.id,
            metadata: {
              amountKES: commission.amountKES,
              conversationId: commission.mpesaTransactionId,
              originatorConversationId: commission.originatorConversationId,
              submittedAt: commission.lastAttemptAt?.toISOString() ?? null,
            } satisfies Prisma.InputJsonObject,
          },
        });
      });
    }

    return commissions.length;
  }
}

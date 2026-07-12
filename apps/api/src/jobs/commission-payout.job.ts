/**
 * Purpose: Daily commission payout sweep: promotes eligible commissions,
 * recovers stalled claims, flags overdue settlements for ops, and hands each
 * due commission to the processor under a cross-replica advisory lock.
 * Why important: this loop pays posters. The stale-recovery split matters:
 * unsent claims are safe to retry, but submitted ones must wait for the
 * settlement result — flipping them back would risk a double payout.
 * Used by: JobsModule (scheduled via @nestjs/schedule).
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommissionStatus, DisputeStatus } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { RequestContextService } from '../common/request-context/request-context.service';
import {
  ADVISORY_LOCK_KEYS,
  releaseAdvisoryLock,
  tryAdvisoryLock,
} from '../common/database/advisory-lock.util';
import { CommissionPayoutProcessor, PayoutCandidate } from './commission-payout.processor';
import {
  CommissionPayoutRecorder,
  SETTLEMENT_OVERDUE_NOTE,
} from './commission-payout.recorder';

const BLOCKING_DISPUTE_STATUSES = new Set<DisputeStatus>([
  DisputeStatus.OPEN,
  DisputeStatus.INVESTIGATING,
]);

@Injectable()
export class CommissionPayoutJob {
  private readonly logger = new Logger(CommissionPayoutJob.name);
  private readonly batchSize = 50;
  private readonly staleUnsentMs = 30 * 60 * 1000;
  private readonly settlementOverdueMs = 24 * 60 * 60 * 1000;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly processor: CommissionPayoutProcessor,
    private readonly recorder: CommissionPayoutRecorder,
    private readonly requestContext: RequestContextService,
  ) {}

  @Cron('0 9 * * *')
  async handleCommissionPayouts() {
    return this.requestContext.runInternal(() => this.runCommissionPayoutsWithLock());
  }

  private async runCommissionPayoutsWithLock() {
    const acquired = await tryAdvisoryLock(
      this.prismaService,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    if (!acquired) {
      this.logger.log(
        JSON.stringify({
          event: 'job.commission-payout.skipped',
          reason: 'another replica holds the advisory lock',
          at: new Date().toISOString(),
        }),
      );
      return null;
    }

    try {
      return await this.processCommissionPayouts();
    } finally {
      await releaseAdvisoryLock(
        this.prismaService,
        ADVISORY_LOCK_KEYS.commissionPayoutJob,
      ).catch((error) => {
        this.logger.warn(
          `Failed to release commission-payout advisory lock: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  }

  async processCommissionPayouts(now = new Date()) {
    const [recoveredProcessing, promotedToDue, settlementOverdue] = await Promise.all([
      this.recoverStaleUnsentCommissions(now),
      this.promoteEligibleCommissions(now),
      this.flagOverdueSettlements(now),
    ]);

    const dueCommissions = await this.prismaService.commission.findMany({
      where: {
        status: CommissionStatus.DUE,
        eligibleAt: { lte: now },
      },
      orderBy: { eligibleAt: 'asc' },
      take: this.batchSize,
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

    const summary = {
      recoveredProcessing,
      promotedToDue,
      settlementOverdue,
      candidates: dueCommissions.length,
      paid: 0,
      submitted: 0,
      retried: 0,
      deadLettered: 0,
      blockedByDispute: 0,
      skipped: 0,
    };

    for (const commission of dueCommissions) {
      if (
        commission.unlock.dispute &&
        BLOCKING_DISPUTE_STATUSES.has(commission.unlock.dispute.status)
      ) {
        summary.blockedByDispute += 1;
        continue;
      }

      const result = await this.processor.process(commission as PayoutCandidate, now);

      if (result === 'paid') summary.paid += 1;
      else if (result === 'submitted') summary.submitted += 1;
      else if (result === 'retry') summary.retried += 1;
      else if (result === 'dead-letter') summary.deadLettered += 1;
      else summary.skipped += 1;
    }

    this.logger.log(
      JSON.stringify({
        event: 'job.commission-payout.summary',
        ...summary,
        at: now.toISOString(),
      }),
    );

    return summary;
  }

  private async promoteEligibleCommissions(now: Date) {
    const result = await this.prismaService.commission.updateMany({
      where: {
        status: CommissionStatus.PENDING,
        eligibleAt: { lte: now },
      },
      data: { status: CommissionStatus.DUE },
    });

    return result.count;
  }

  /**
   * Recovers PROCESSING rows that never reached Safaricom (no acceptance
   * ConversationID recorded). Rows WITH a recorded submission are excluded:
   * their money may have moved, so only a settlement signal or an operator
   * may resolve them (see flagOverdueSettlements).
   */
  private async recoverStaleUnsentCommissions(now: Date) {
    const staleBefore = new Date(now.getTime() - this.staleUnsentMs);
    const result = await this.prismaService.commission.updateMany({
      where: {
        status: CommissionStatus.PROCESSING,
        mpesaTransactionId: null,
        lastAttemptAt: { lt: staleBefore },
      },
      data: {
        status: CommissionStatus.DUE,
        lastAttemptError: 'Recovered from stale processing state',
      },
    });

    return result.count;
  }

  private async flagOverdueSettlements(now: Date) {
    const overdueBefore = new Date(now.getTime() - this.settlementOverdueMs);
    const overdue = await this.prismaService.commission.findMany({
      where: {
        status: CommissionStatus.PROCESSING,
        mpesaTransactionId: { not: null },
        lastAttemptAt: { lt: overdueBefore },
        NOT: { lastAttemptError: SETTLEMENT_OVERDUE_NOTE },
      },
      select: {
        id: true,
        amountKES: true,
        mpesaTransactionId: true,
        originatorConversationId: true,
        lastAttemptAt: true,
      },
    });

    if (overdue.length === 0) {
      return 0;
    }

    this.logger.error(
      JSON.stringify({
        event: 'job.commission-payout.settlement-overdue',
        commissionIds: overdue.map((commission) => commission.id),
        at: now.toISOString(),
      }),
    );

    return this.recorder.flagSettlementOverdue(overdue);
  }
}

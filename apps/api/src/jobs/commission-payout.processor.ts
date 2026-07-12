/**
 * Purpose: Executes one commission payout: claims the row, re-checks
 * disputes, confirms prior submissions with Safaricom, sends the B2C, and
 * records the outcome. Acceptance leaves the row PROCESSING — only a
 * settlement signal (result callback, or a confirmed status query via the
 * confirmer) marks PAID, because Daraja B2C acceptance is not settlement.
 * Why important: this is where real shillings leave the org account; the
 * duplicate-submission handling is what makes crash retries single-spend.
 * Used by: commission-payout.job.ts (batch loop).
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommissionStatus, DisputeStatus } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { MpesaClient } from '../infrastructure/payment/mpesa.client';
import { MpesaDuplicateSubmissionError } from '../infrastructure/payment/mpesa.types';
import { UserService } from '../modules/user/user.service';
import { CommissionPayoutRecorder } from './commission-payout.recorder';
import { CommissionSettlementConfirmer } from './commission-settlement.confirmer';

export type PayoutOutcome = 'paid' | 'submitted' | 'retry' | 'dead-letter' | 'skipped';

export type PayoutCandidate = {
  id: string;
  unlockId: string;
  amountKES: number;
  paymentAttempts: number;
  originatorConversationId: string | null;
  unlock: {
    dispute: { status: DisputeStatus } | null;
    listing: {
      id: string;
      neighborhood: string;
      user: { phoneNumberEncrypted: string | null };
    };
  };
};

const BLOCKING_DISPUTE_STATUSES = new Set<DisputeStatus>([
  DisputeStatus.OPEN,
  DisputeStatus.INVESTIGATING,
]);

@Injectable()
export class CommissionPayoutProcessor {
  private readonly logger = new Logger(CommissionPayoutProcessor.name);
  private readonly maxAttempts = 3;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mpesaClient: MpesaClient,
    private readonly userService: UserService,
    private readonly recorder: CommissionPayoutRecorder,
    private readonly confirmer: CommissionSettlementConfirmer,
  ) {}

  async process(commission: PayoutCandidate, now: Date): Promise<PayoutOutcome> {
    const claimed = await this.prismaService.commission.updateMany({
      where: { id: commission.id, status: CommissionStatus.DUE },
      data: {
        status: CommissionStatus.PROCESSING,
        lastAttemptAt: now,
        lastAttemptError: null,
      },
    });

    if (claimed.count === 0) {
      return 'skipped';
    }

    const freshDispute = await this.prismaService.dispute.findUnique({
      where: { unlockId: commission.unlockId },
      select: { status: true },
    });

    if (freshDispute && BLOCKING_DISPUTE_STATUSES.has(freshDispute.status)) {
      await this.prismaService.commission.update({
        where: { id: commission.id },
        data: {
          status: CommissionStatus.DUE,
          lastAttemptError: 'Blocked by dispute after payout claim',
        },
      });

      return 'skipped';
    }

    const encryptedPhone = commission.unlock.listing.user.phoneNumberEncrypted;
    if (!encryptedPhone) {
      this.logger.warn(`Commission ${commission.id}: tenant has no phone number, skipping payout`);
      return 'skipped';
    }

    const phoneNumber = this.userService.decryptPhoneNumber(encryptedPhone);
    const originatorConversationId = await this.ensureOriginatorConversationId(commission);
    const attempts = commission.paymentAttempts;

    // Anything already sent once must be positively confirmed before a
    // re-issue: a crash after acceptance must not become a second payout.
    if (attempts > 0) {
      const confirmed = await this.confirmer.confirmFromQuery(
        commission,
        originatorConversationId,
        phoneNumber,
        attempts,
        now,
      );

      if (confirmed) {
        return confirmed;
      }
    }

    try {
      const payout = await this.mpesaClient.b2c({
        phoneNumber,
        amount: commission.amountKES,
        remarks: `PataSpace commission payout ${commission.id}`,
        originatorConversationId,
      });

      await this.recorder.recordSubmission(commission.id, payout.conversationId, attempts + 1, now);

      // One immediate confirm: the sandbox settles instantly here, while
      // live Daraja answers 'pending' and the result callback finishes the
      // job seconds later.
      const confirmed = await this.confirmer.confirmFromQuery(
        commission,
        originatorConversationId,
        phoneNumber,
        attempts + 1,
        now,
      );

      return confirmed ?? 'submitted';
    } catch (error) {
      return this.recordSendFailure(commission, attempts, error, now);
    }
  }

  private async recordSendFailure(
    commission: PayoutCandidate,
    attempts: number,
    error: unknown,
    now: Date,
  ): Promise<PayoutOutcome> {
    if (error instanceof MpesaDuplicateSubmissionError) {
      // The earlier submission exists at Safaricom; its settlement result
      // decides this row. Keep waiting — never re-issue or dead-letter.
      await this.recorder.recordDuplicateSubmission(commission.id, attempts + 1, now);
      return 'submitted';
    }

    const nextAttempts = attempts + 1;
    const terminalFailure = nextAttempts >= this.maxAttempts;
    const errorMessage = error instanceof Error ? error.message : 'Commission payout failed';

    if (terminalFailure) {
      await this.recorder.markDeadLettered(commission, errorMessage, nextAttempts, now);
    } else {
      await this.recorder.recordRetryFailure(commission.id, nextAttempts, errorMessage, now);
    }

    this.logger.error(
      JSON.stringify({
        event: 'job.commission-payout.failure',
        commissionId: commission.id,
        attempts: nextAttempts,
        terminalFailure,
        error: errorMessage,
      }),
    );

    return terminalFailure ? 'dead-letter' : 'retry';
  }

  /**
   * Returns the stable OriginatorConversationID for this commission,
   * persisting a fresh one BEFORE the first B2C call so any retry passes the
   * same id and Safaricom can dedupe instead of double-paying.
   */
  private async ensureOriginatorConversationId(commission: {
    id: string;
    originatorConversationId: string | null;
  }): Promise<string> {
    if (commission.originatorConversationId) {
      return commission.originatorConversationId;
    }

    const id = `pataspace-${randomUUID()}`;
    await this.prismaService.commission.update({
      where: { id: commission.id },
      data: { originatorConversationId: id },
    });
    return id;
  }
}

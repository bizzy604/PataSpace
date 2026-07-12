/**
 * Purpose: Positive settlement confirmation for payouts: asks Safaricom for
 * the fate of a prior submission and records PAID (with receipt and SMS) or
 * FAILED accordingly; "no decision" is returned as null.
 * Why important: this is the only job-side path allowed to write PAID —
 * everything else waits for the B2C result callback. The claim inside the
 * recorder makes the callback and this confirmer race-safe.
 * Used by: commission-payout.processor.ts.
 */
import { Injectable, Logger } from '@nestjs/common';
import { MpesaClient } from '../infrastructure/payment/mpesa.client';
import { MpesaB2CQueryResponse } from '../infrastructure/payment/mpesa.types';
import { SmsService } from '../infrastructure/sms/sms.service';
import { CommissionPayoutRecorder, PayoutRecordTarget } from './commission-payout.recorder';

export type ConfirmedOutcome = 'paid' | 'dead-letter' | 'skipped';

@Injectable()
export class CommissionSettlementConfirmer {
  private readonly logger = new Logger(CommissionSettlementConfirmer.name);

  constructor(
    private readonly mpesaClient: MpesaClient,
    private readonly smsService: SmsService,
    private readonly recorder: CommissionPayoutRecorder,
  ) {}

  /**
   * Queries the submission's status and settles the row when Safaricom has
   * a final answer. Returns null when there is no decision yet — the caller
   * keeps the row PROCESSING and the result callback finishes the job.
   */
  async confirmFromQuery(
    commission: PayoutRecordTarget,
    originatorConversationId: string,
    phoneNumber: string,
    attempts: number,
    now: Date,
  ): Promise<ConfirmedOutcome | null> {
    const queryOutcome = await this.queryExistingPayout(commission.id, originatorConversationId);

    if (queryOutcome?.outcome === 'success') {
      return this.recordConfirmedPayout(commission, originatorConversationId, phoneNumber, now, {
        conversationId: queryOutcome.conversationId,
        mpesaReceiptNumber: queryOutcome.mpesaReceiptNumber,
      });
    }

    if (queryOutcome?.outcome === 'failed') {
      const reason = queryOutcome.resultDesc ?? 'M-Pesa reported the previous payout as failed';
      await this.recorder.markDeadLettered(commission, reason, attempts, now);
      return 'dead-letter';
    }

    return null;
  }

  async recordConfirmedPayout(
    commission: PayoutRecordTarget,
    originatorConversationId: string,
    phoneNumber: string,
    now: Date,
    payout: { conversationId?: string; mpesaReceiptNumber?: string },
  ): Promise<ConfirmedOutcome> {
    const recorded = await this.recorder.markPaid(commission, originatorConversationId, now, payout);

    if (!recorded) {
      // The result callback settled the row first; it also sent the SMS.
      return 'skipped';
    }

    await this.sendSmsQuietly(
      phoneNumber,
      `You've received ${commission.amountKES} KES from PataSpace. Check your M-Pesa.`,
    );

    return 'paid';
  }

  /**
   * Best-effort B2C status lookup. Swallows provider errors so they cannot
   * crash the payout run — caller treats `null` the same as "pending".
   */
  private async queryExistingPayout(
    commissionId: string,
    originatorConversationId: string,
  ): Promise<MpesaB2CQueryResponse | null> {
    try {
      return await this.mpesaClient.queryB2CTransaction({ originatorConversationId });
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'job.commission-payout.query-error',
          commissionId,
          originatorConversationId,
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
      return null;
    }
  }

  private async sendSmsQuietly(phoneNumber: string, message: string) {
    try {
      await this.smsService.sendMessage(phoneNumber, message);
    } catch {
      return;
    }
  }
}

/**
 * Purpose: M-Pesa STK push execution and callback settlement for credit
 * purchases. Reconciliation of stale rows lives in MpesaReconcileService.
 * Why important: once the STK prompt is on the user's phone, the money may
 * move regardless of what our process does next — so a provider failure and
 * a local bookkeeping failure must be recorded differently (FAILED vs
 * stay-PENDING).
 * Used by: payment.service.ts (orchestrator)
 */
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { MpesaCallbackRequest } from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { MpesaClient } from '../../infrastructure/payment/mpesa.client';
import { parseStkCallback } from './mpesa-callback.util';
import { mergeMetadata } from './payment-metadata.util';
import { PaymentFulfillmentService, PaymentSettlementRecord } from './payment-fulfillment.service';

type PurchasePackageConfig = { amountKES: number; credits: number; label: string };

type StkPushResult = { checkoutRequestId: string; merchantRequestId: string };

@Injectable()
export class MpesaPurchaseService {
  private readonly logger = new Logger(MpesaPurchaseService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mpesaClient: MpesaClient,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async executeStkPush(transactionId: string, phoneNumber: string, packageConfig: PurchasePackageConfig) {
    let response: StkPushResult;

    try {
      response = await this.mpesaClient.stkPush({
        phoneNumber,
        amount: packageConfig.amountKES,
        accountReference: transactionId,
      });
    } catch (error) {
      // The provider call itself failed: no prompt reached the user, so
      // FAILED is the truthful terminal state.
      const reason = error instanceof Error ? error.message : 'STK push failed';
      this.logger.error('STK push failed', JSON.stringify({ reason, transactionId }));

      await this.markStkPushFailed(transactionId, reason);

      throw new ServiceUnavailableException({ code: 'MPESA_UNAVAILABLE', message: 'M-Pesa service is currently unavailable' });
    }

    await this.recordStkSubmission(transactionId, response);

    return { checkoutRequestId: response.checkoutRequestId };
  }

  async handleCallback(input: MpesaCallbackRequest) {
    const cb = parseStkCallback(input);
    const tx = await this.fulfillment.findPurchaseTransactionByLookup(cb.checkoutRequestId, cb.mpesaReceiptNumber);

    if (!tx || tx.status !== TransactionStatus.PENDING) {
      return { ResultCode: 0 as const, ResultDesc: 'Accepted' as const };
    }

    const record: PaymentSettlementRecord = {
      amountPaid: cb.amount,
      phoneNumber: cb.phoneNumber,
      phoneNumberHash: cb.phoneNumberHash,
      mpesaReceiptNumber: cb.mpesaReceiptNumber,
      mpesaCheckoutRequestId: cb.checkoutRequestId,
      merchantRequestId: cb.merchantRequestId,
      resultDesc: cb.resultDesc,
    };

    if (cb.resultCode === 0 && cb.mpesaReceiptNumber && cb.amount !== null) {
      await this.fulfillment.processSuccessfulPayment(tx.id, record);
    } else {
      await this.fulfillment.processFailedPayment(tx.id, cb.resultCode, cb.resultDesc, record);
    }

    return { ResultCode: 0 as const, ResultDesc: 'Accepted' as const };
  }

  /**
   * The prompt is already on the user's phone once stkPush resolves, so a
   * bookkeeping failure here must NOT mark the row FAILED — the user may
   * pay. Retry the write; if it still fails, leave the row PENDING and let
   * reconciliation expire it (the callback cannot match without the id).
   */
  private async recordStkSubmission(transactionId: string, response: StkPushResult) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const existing = await this.prismaService.creditTransaction.findUnique({
          where: { id: transactionId },
          select: { metadata: true },
        });

        await this.prismaService.creditTransaction.update({
          where: { id: transactionId },
          data: {
            mpesaTransactionId: response.checkoutRequestId,
            metadata: mergeMetadata(existing?.metadata ?? null, {
              checkoutRequestId: response.checkoutRequestId,
              merchantRequestId: response.merchantRequestId,
            }),
          },
        });

        return;
      } catch (error) {
        lastError = error;
      }
    }

    this.logger.error(
      'Failed to record STK submission; row stays PENDING for reconciliation to expire',
      JSON.stringify({
        transactionId,
        checkoutRequestId: response.checkoutRequestId,
        reason: lastError instanceof Error ? lastError.message : 'unknown',
      }),
    );
  }

  // The failure note must merge into the existing metadata — replacing it
  // would destroy paymentAmountKES and the phone fields that reconciliation
  // and support depend on.
  private async markStkPushFailed(transactionId: string, reason: string) {
    try {
      const existing = await this.prismaService.creditTransaction.findUnique({
        where: { id: transactionId },
        select: { metadata: true },
      });

      await this.prismaService.creditTransaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.FAILED,
          metadata: mergeMetadata(existing?.metadata ?? null, { failureReason: reason }),
        },
      });
    } catch (markError) {
      this.logger.error(
        'Failed to mark STK transaction as FAILED; row stays PENDING for reconciliation',
        JSON.stringify({
          transactionId,
          reason: markError instanceof Error ? markError.message : 'unknown',
        }),
      );
    }
  }
}

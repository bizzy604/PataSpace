/**
 * Purpose: All M-Pesa-specific purchase logic: STK push execution, callback parsing, reconciliation.
 * Why important: Isolates Daraja API complexity from the payment orchestrator and Stellar code.
 * Used by: payment.service.ts (orchestrator)
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { MpesaCallbackRequest } from '@pataspace/contracts';
import { hashLookupValue } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { MpesaClient } from '../../infrastructure/payment/mpesa.client';
import { parseStkCallback } from './mpesa-callback.util';
import { mergeMetadata, readNumberMetadata, readStringMetadata } from './payment-metadata.util';
import { PaymentFulfillmentService, PaymentSettlementRecord } from './payment-fulfillment.service';

type PurchasePackageConfig = { amountKES: number; credits: number; label: string };

const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class MpesaPurchaseService {
  private readonly logger = new Logger(MpesaPurchaseService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mpesaClient: MpesaClient,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async executeStkPush(transactionId: string, phoneNumber: string, packageConfig: PurchasePackageConfig) {
    try {
      const response = await this.mpesaClient.stkPush({
        phoneNumber,
        amount: packageConfig.amountKES,
        accountReference: transactionId,
      });

      await this.prismaService.creditTransaction.update({
        where: { id: transactionId },
        data: {
          mpesaTransactionId: response.checkoutRequestId,
          metadata: mergeMetadata(
            (await this.prismaService.creditTransaction.findUnique({ where: { id: transactionId }, select: { metadata: true } }))?.metadata,
            { checkoutRequestId: response.checkoutRequestId, merchantRequestId: response.merchantRequestId },
          ),
        },
      });

      return { checkoutRequestId: response.checkoutRequestId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'STK push failed';
      this.logger.error('STK push failed', JSON.stringify({ reason, transactionId }));

      await this.markStkPushFailed(transactionId, reason);

      throw new ServiceUnavailableException({ code: 'MPESA_UNAVAILABLE', message: 'M-Pesa service is currently unavailable' });
    }
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

  async reconcilePending(now: Date, userId?: string) {
    const staleBefore = new Date(now.getTime() - PENDING_TIMEOUT_MS);
    const pending = await this.prismaService.creditTransaction.findMany({
      where: {
        ...(userId ? { userId } : {}),
        paymentMethod: 'MPESA',
        status: TransactionStatus.PENDING,
        createdAt: { lt: staleBefore },
      },
      select: { id: true, metadata: true, mpesaTransactionId: true },
      orderBy: { createdAt: 'asc' },
      take: userId ? undefined : 100,
    });

    let count = 0;

    for (const tx of pending) {
      if (!tx.mpesaTransactionId) continue;

      try {
        const query = await this.mpesaClient.queryStkPush({ checkoutRequestId: tx.mpesaTransactionId });

        // No decision from Daraja (still processing, or the response shape
        // dropped ResultCode). Settling on a guessed code is how credits get
        // granted for payments that never happened — leave the row PENDING.
        if (query.resultCode === null) {
          this.logger.warn('STK query indeterminate; leaving pending', JSON.stringify({ transactionId: tx.id }));
          continue;
        }

        const fallbackAmount = readNumberMetadata(tx.metadata, 'paymentAmountKES');

        if (query.resultCode === 0 && fallbackAmount === null) {
          this.logger.warn('STK query succeeded but expected amount is unknown; leaving pending', JSON.stringify({ transactionId: tx.id }));
          continue;
        }

        const resolvedPhone = query.phoneNumber ?? readStringMetadata(tx.metadata, 'callbackPhoneNumber') ?? readStringMetadata(tx.metadata, 'requestedPhoneNumber');

        const record: PaymentSettlementRecord = {
          amountPaid: fallbackAmount,
          phoneNumber: resolvedPhone,
          phoneNumberHash: resolvedPhone ? hashLookupValue(resolvedPhone) : null,
          mpesaReceiptNumber: query.mpesaReceiptNumber ?? null,
          mpesaCheckoutRequestId: query.checkoutRequestId,
          merchantRequestId: readStringMetadata(tx.metadata, 'merchantRequestId'),
          resultDesc: query.resultDesc,
        };

        if (query.resultCode === 0) {
          await this.fulfillment.processSuccessfulPayment(tx.id, record);
        } else {
          await this.fulfillment.processFailedPayment(tx.id, query.resultCode, query.resultDesc, record);
        }

        count += 1;
      } catch (error) {
        this.logger.warn(
          'STK reconcile query failed; will retry next tick',
          JSON.stringify({
            transactionId: tx.id,
            reason: error instanceof Error ? error.message : 'unknown',
          }),
        );
        continue;
      }
    }

    return count;
  }
}

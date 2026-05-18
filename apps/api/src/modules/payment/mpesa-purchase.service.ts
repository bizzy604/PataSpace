/**
 * Purpose: All M-Pesa-specific purchase logic: STK push execution, callback parsing, reconciliation.
 * Why important: Isolates Daraja API complexity from the payment orchestrator and Stellar code.
 * Used by: payment.service.ts (orchestrator)
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { MpesaCallbackRequest } from '@pataspace/contracts';
import { hashLookupValue, normalizePhoneNumber } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { MpesaClient } from '../../infrastructure/payment/mpesa.client';
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
      this.logger.error('STK push failed', JSON.stringify({ reason }));

      await this.prismaService.creditTransaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.FAILED, metadata: mergeMetadata(null, { failureReason: reason }) },
      });

      throw new ServiceUnavailableException({ code: 'MPESA_UNAVAILABLE', message: 'M-Pesa service is currently unavailable' });
    }
  }

  async handleCallback(input: MpesaCallbackRequest) {
    const cb = this.parseCallback(input);
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
        const fallbackAmount = readNumberMetadata(tx.metadata, 'paymentAmountKES');
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

        if (query.resultCode === 0 && fallbackAmount !== null) {
          await this.fulfillment.processSuccessfulPayment(tx.id, record);
        } else {
          await this.fulfillment.processFailedPayment(tx.id, query.resultCode, query.resultDesc, record);
        }

        count += 1;
      } catch {
        continue;
      }
    }

    return count;
  }

  private parseCallback(input: MpesaCallbackRequest) {
    const payload = input.Body.stkCallback;
    const items = payload.CallbackMetadata?.Item ?? [];
    const amountValue = items.find((i) => i.Name === 'Amount')?.Value;
    const phoneValue = items.find((i) => i.Name === 'PhoneNumber')?.Value;
    const receiptValue = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
    const normalizedPhone = phoneValue != null ? normalizePhoneNumber(String(phoneValue)) : null;

    return {
      checkoutRequestId: payload.CheckoutRequestID,
      merchantRequestId: payload.MerchantRequestID,
      resultCode: payload.ResultCode,
      resultDesc: payload.ResultDesc,
      amount: amountValue != null ? Number(amountValue) : null,
      mpesaReceiptNumber: typeof receiptValue === 'string' ? receiptValue : null,
      phoneNumber: normalizedPhone,
      phoneNumberHash: normalizedPhone ? hashLookupValue(normalizedPhone) : null,
    };
  }
}

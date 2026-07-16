/**
 * Purpose: Resolves stale PENDING M-Pesa purchases: queries Daraja for rows
 * with a CheckoutRequestID, and expires rows that never got one (the STK
 * push died before the id was recorded).
 * Why important: the expiry path is what unblocks a user after a crashed
 * purchase — one PENDING row otherwise blocks all future purchases forever.
 * Settlement decisions stay conservative: no decision means stay PENDING.
 * Used by: payment.service.ts (reconcilePendingPurchases), the 5-minute
 * PaymentReconciliationJob, and createPurchase's pre-flight sweep.
 */
import { Injectable, Logger } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { hashLookupValue } from '../../common/security/encryption.util';
import { PrismaService } from '../../common/database/prisma.service';
import { MpesaClient } from '../../infrastructure/payment/mpesa.client';
import { readNumberMetadata, readStringMetadata } from './payment-metadata.util';
import { PaymentFulfillmentService, PaymentSettlementRecord } from './payment-fulfillment.service';

const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

type StalePendingRow = {
  id: string;
  metadata: unknown;
  mpesaTransactionId: string | null;
};

@Injectable()
export class MpesaReconcileService {
  private readonly logger = new Logger(MpesaReconcileService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mpesaClient: MpesaClient,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

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
      if (!tx.mpesaTransactionId) {
        count += await this.expireWithoutCheckoutId(tx.id);
        continue;
      }

      count += await this.resolveFromDaraja(tx as StalePendingRow, tx.mpesaTransactionId);
    }

    return count;
  }

  /**
   * The STK push never completed (crash before the CheckoutRequestID was
   * recorded), so there is nothing to query and the row would otherwise
   * block the user's purchases forever. Expire it. If the user did pay on a
   * push whose id write failed, support resolves it via the Daraja portal —
   * the amount and phone survive in the row's metadata.
   */
  private async expireWithoutCheckoutId(transactionId: string) {
    await this.fulfillment.processFailedPayment(
      transactionId,
      -3,
      'STK push never completed (no CheckoutRequestID recorded); expired by reconciliation',
    );

    return 1;
  }

  private async resolveFromDaraja(tx: StalePendingRow, checkoutRequestId: string) {
    try {
      const query = await this.mpesaClient.queryStkPush({ checkoutRequestId });

      // No decision from Daraja (still processing, or the response shape
      // dropped ResultCode). Settling on a guessed code is how credits get
      // granted for payments that never happened — leave the row PENDING.
      if (query.resultCode === null) {
        this.logger.warn('STK query indeterminate; leaving pending', JSON.stringify({ transactionId: tx.id }));
        return 0;
      }

      const fallbackAmount = readNumberMetadata(tx.metadata as never, 'paymentAmountKES');

      if (query.resultCode === 0 && fallbackAmount === null) {
        this.logger.warn('STK query succeeded but expected amount is unknown; leaving pending', JSON.stringify({ transactionId: tx.id }));
        return 0;
      }

      const resolvedPhone =
        query.phoneNumber ??
        readStringMetadata(tx.metadata as never, 'callbackPhoneNumber') ??
        readStringMetadata(tx.metadata as never, 'requestedPhoneNumber');

      const record: PaymentSettlementRecord = {
        amountPaid: fallbackAmount,
        phoneNumber: resolvedPhone,
        phoneNumberHash: resolvedPhone ? hashLookupValue(resolvedPhone) : null,
        mpesaReceiptNumber: query.mpesaReceiptNumber ?? null,
        mpesaCheckoutRequestId: query.checkoutRequestId,
        merchantRequestId: readStringMetadata(tx.metadata as never, 'merchantRequestId'),
        resultDesc: query.resultDesc,
      };

      if (query.resultCode === 0) {
        await this.fulfillment.processSuccessfulPayment(tx.id, record);
      } else {
        await this.fulfillment.processFailedPayment(tx.id, query.resultCode, query.resultDesc, record);
      }

      return 1;
    } catch (error) {
      this.logger.warn(
        'STK reconcile query failed; will retry next tick',
        JSON.stringify({
          transactionId: tx.id,
          reason: error instanceof Error ? error.message : 'unknown',
        }),
      );
      return 0;
    }
  }
}

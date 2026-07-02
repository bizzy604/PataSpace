/**
 * Purpose: Stellar-specific credit purchase — creates payment requests and reconciles settlements via Horizon.
 * Why important: Encapsulates all XLM/stablecoin payment logic away from M-Pesa and the orchestrator.
 * Used by: payment.service.ts (orchestrator)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { StellarClient } from '../../infrastructure/stellar/stellar.client';
import { PaymentFulfillmentService } from './payment-fulfillment.service';
import { mergeMetadata, readNumberMetadata, readStringMetadata } from './payment-metadata.util';

type PackageConfig = { amountKES: number };

const STELLAR_PENDING_TIMEOUT_MS = 30 * 60 * 1000;
const STELLAR_MIN_RECONCILE_AGE_MS = 60 * 1000;
// One stroop (1e-7 XLM) of slack absorbs 7-decimal rounding on the quoted
// amount; anything more than that below the quote is treated as underpayment.
const STELLAR_AMOUNT_TOLERANCE_XLM = 0.0000001;

@Injectable()
export class StellarPurchaseService {
  private readonly logger = new Logger(StellarPurchaseService.name);
  private readonly xlmKesRate: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly stellarClient: StellarClient,
    private readonly fulfillment: PaymentFulfillmentService,
    private readonly configService: ConfigService,
  ) {
    this.xlmKesRate = this.configService.get<number>('infrastructure.stellar.xlmKesRate') ?? 17;
  }

  async createPaymentRequest(transactionId: string, packageConfig: PackageConfig) {
    const amountXLM = this.kesToXlm(packageConfig.amountKES);
    const response = await this.stellarClient.createPaymentRequest({ memo: transactionId, amountXLM });

    // Persist the exact quoted amount so reconciliation verifies against the
    // figure the buyer was told to send, immune to later XLM/KES rate drift.
    const existing = await this.prismaService.creditTransaction.findUnique({
      where: { id: transactionId },
      select: { metadata: true },
    });
    await this.prismaService.creditTransaction.update({
      where: { id: transactionId },
      data: { metadata: mergeMetadata(existing?.metadata ?? null, { stellarAmountXLM: amountXLM }) },
    });

    return {
      stellarDestinationAddress: response.destinationAddress,
      stellarMemo: transactionId,
      stellarAmountXLM: amountXLM,
      network: response.network,
    };
  }

  async reconcilePending(now: Date, userId?: string) {
    const staleBefore = new Date(now.getTime() - STELLAR_MIN_RECONCILE_AGE_MS);
    const expiredBefore = new Date(now.getTime() - STELLAR_PENDING_TIMEOUT_MS);

    const pending = await this.prismaService.creditTransaction.findMany({
      where: {
        ...(userId ? { userId } : {}),
        paymentMethod: 'STELLAR',
        status: TransactionStatus.PENDING,
        createdAt: { lt: staleBefore },
      },
      select: { id: true, createdAt: true, metadata: true },
      orderBy: { createdAt: 'asc' },
      take: userId ? undefined : 100,
    });

    let count = 0;

    for (const tx of pending) {
      try {
        const expectedAmountXLM = this.resolveExpectedAmountXLM(tx.metadata);

        // Without a known quote we cannot verify the amount, so we never grant
        // credits — only expire on timeout. This should not happen for
        // transactions created after createPaymentRequest persisted the quote.
        if (expectedAmountXLM === null) {
          this.logger.warn(`Stellar tx ${tx.id} has no quoted amount; cannot verify settlement`);
          if (tx.createdAt < expiredBefore) {
            await this.fulfillment.processFailedPayment(tx.id, -1, 'Stellar payment quote missing; cannot verify');
            count += 1;
          }
          continue;
        }

        const record = await this.stellarClient.findIncomingPayment({ memo: tx.id, expectedAmountXLM });

        if (record) {
          const received = Number(record.amountXLM);
          const expected = Number(expectedAmountXLM);

          if (Number.isFinite(received) && received + STELLAR_AMOUNT_TOLERANCE_XLM >= expected) {
            await this.fulfillment.processSuccessfulPayment(tx.id, {
              amountPaid: null,
              stellarTransactionHash: record.transactionHash,
            });
            count += 1;
            continue;
          }

          // A memo-matching payment arrived but for less than the quote. Reject
          // it outright rather than granting — this is the underpayment bypass.
          await this.fulfillment.processFailedPayment(
            tx.id,
            -2,
            `Stellar payment of ${record.amountXLM} XLM is below the required ${expectedAmountXLM} XLM`,
            { stellarTransactionHash: record.transactionHash },
          );
          count += 1;
          continue;
        }

        if (tx.createdAt < expiredBefore) {
          await this.fulfillment.processFailedPayment(tx.id, -1, 'Stellar payment not received within 30 minutes');
          count += 1;
        }
      } catch (error) {
        this.logger.warn(`Stellar reconciliation failed for tx ${tx.id}: ${error instanceof Error ? error.message : 'unknown'}`);
        continue;
      }
    }

    return count;
  }

  private resolveExpectedAmountXLM(metadata: Prisma.JsonValue | null): string | null {
    const quoted = readStringMetadata(metadata, 'stellarAmountXLM');
    if (quoted) {
      return quoted;
    }

    // Fallback for transactions created before the quote was persisted: derive
    // it from the recorded KES amount at the current rate.
    const amountKES = readNumberMetadata(metadata, 'paymentAmountKES');
    return amountKES !== null ? this.kesToXlm(amountKES) : null;
  }

  private kesToXlm(amountKES: number): string {
    return (amountKES / this.xlmKesRate).toFixed(7);
  }
}

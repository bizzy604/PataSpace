/**
 * Purpose: Stellar-specific credit purchase — creates payment requests and reconciles settlements via Horizon.
 * Why important: Encapsulates all XLM/stablecoin payment logic away from M-Pesa and the orchestrator.
 * Used by: payment.service.ts (orchestrator)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { StellarClient } from '../../infrastructure/stellar/stellar.client';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

type PackageConfig = { amountKES: number };

const STELLAR_PENDING_TIMEOUT_MS = 30 * 60 * 1000;
const STELLAR_MIN_RECONCILE_AGE_MS = 60 * 1000;

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
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: userId ? undefined : 100,
    });

    let count = 0;

    for (const tx of pending) {
      try {
        const record = await this.stellarClient.findIncomingPayment({ memo: tx.id });

        if (record) {
          await this.fulfillment.processSuccessfulPayment(tx.id, {
            amountPaid: null,
            stellarTransactionHash: record.transactionHash,
          });
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

  private kesToXlm(amountKES: number): string {
    return (amountKES / this.xlmKesRate).toFixed(7);
  }
}

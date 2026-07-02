/**
 * Purpose: Production Stellar provider using the Horizon API to detect incoming treasury payments.
 * Why important: Connects PataSpace to the live Stellar network for real XLM/stablecoin settlements.
 * Used by: stellar.module.ts
 */

import { Horizon } from '@stellar/stellar-sdk';
import {
  StellarFindPaymentRequest,
  StellarPaymentRequest,
  StellarProvider,
} from '../stellar.types';

type LiveStellarConfig = {
  horizonUrl: string;
  treasuryPublicKey: string;
};

export class LiveStellarProvider implements StellarProvider {
  private readonly server: Horizon.Server;

  constructor(private readonly config: LiveStellarConfig) {
    this.server = new Horizon.Server(config.horizonUrl);
  }

  async createPaymentRequest(req: StellarPaymentRequest) {
    return {
      destinationAddress: this.config.treasuryPublicKey,
      memo: req.memo,
      amountXLM: req.amountXLM,
      network: 'mainnet' as const,
    };
  }

  async findIncomingPayment(req: StellarFindPaymentRequest) {
    const page = await this.server
      .transactions()
      .forAccount(this.config.treasuryPublicKey)
      .order('desc')
      .limit(200)
      .call();

    const matches = page.records.filter(
      (tx) => tx.successful && tx.memo === req.memo,
    );

    if (matches.length === 0) {
      return null;
    }

    // Sum only native-XLM payments whose destination is the treasury, across
    // every settled transaction carrying this memo. Anything else (a different
    // asset, an outbound transfer, a path payment to another account) does not
    // count toward the purchase — this is what closes the amount-bypass hole.
    let receivedXLM = 0;
    for (const tx of matches) {
      const operations = await tx.operations();
      for (const operation of operations.records) {
        receivedXLM += this.treasuryNativeAmount(operation);
      }
    }

    const primary = matches[0];
    return {
      transactionHash: primary.hash,
      from: primary.source_account,
      memo: req.memo,
      settledAt: primary.created_at,
      amountXLM: receivedXLM.toFixed(7),
    };
  }

  private treasuryNativeAmount(operation: unknown): number {
    const op = operation as {
      type?: string;
      asset_type?: string;
      to?: string;
      amount?: string;
    };

    if (
      op.type === 'payment' &&
      op.asset_type === 'native' &&
      op.to === this.config.treasuryPublicKey
    ) {
      const amount = Number(op.amount);
      return Number.isFinite(amount) && amount > 0 ? amount : 0;
    }

    return 0;
  }

  async healthCheck() {
    try {
      await this.server.loadAccount(this.config.treasuryPublicKey);
      return { status: 'up' as const, provider: 'live' };
    } catch (error) {
      return {
        status: 'down' as const,
        provider: 'live',
        message: error instanceof Error ? error.message : 'Horizon account load failed',
      };
    }
  }
}

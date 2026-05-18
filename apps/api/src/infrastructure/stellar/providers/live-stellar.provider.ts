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

    const match = page.records.find(
      (tx) => tx.successful && tx.memo === req.memo,
    );

    if (!match) {
      return null;
    }

    return {
      transactionHash: match.hash,
      from: match.source_account,
      memo: req.memo,
      settledAt: match.created_at,
    };
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

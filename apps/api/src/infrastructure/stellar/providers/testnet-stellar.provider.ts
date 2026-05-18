/**
 * Purpose: Testnet Stellar provider — auto-completes payments for development without real XLM.
 * Why important: Mirrors the SandboxMpesaProvider pattern; lets integration tests run offline.
 * Used by: stellar.module.ts
 */

import { randomUUID } from 'crypto';
import {
  StellarFindPaymentRequest,
  StellarPaymentRequest,
  StellarProvider,
} from '../stellar.types';

export class TestnetStellarProvider implements StellarProvider {
  constructor(
    private readonly treasuryPublicKey: string,
    private readonly behavior: { failPayment?: boolean } = {},
  ) {}

  async createPaymentRequest(req: StellarPaymentRequest) {
    return {
      destinationAddress: this.treasuryPublicKey || 'GABC123TESTNET_TREASURY_ADDRESS',
      memo: req.memo,
      amountXLM: req.amountXLM,
      network: 'testnet' as const,
    };
  }

  async findIncomingPayment(req: StellarFindPaymentRequest) {
    if (this.behavior.failPayment) {
      return null;
    }

    // Auto-complete: simulate an immediate on-chain settlement
    return {
      transactionHash: `testnet_${randomUUID().replace(/-/g, '')}`,
      from: 'GABC123TESTNET_SENDER',
      memo: req.memo,
      settledAt: new Date().toISOString(),
    };
  }

  async healthCheck() {
    return {
      status: this.behavior.failPayment ? ('degraded' as const) : ('up' as const),
      provider: 'testnet',
      message: this.behavior.failPayment
        ? 'Testnet Stellar adapter active with payment failure injection.'
        : 'Testnet Stellar adapter active. Payments auto-complete.',
    };
  }
}

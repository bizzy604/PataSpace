/**
 * Purpose: No-op Stellar provider thrown when STELLAR_MODE is unrecognised or 'disabled'.
 * Why important: Prevents silent misconfiguration from calling a real network.
 * Used by: stellar.module.ts
 */

import {
  StellarFindPaymentRequest,
  StellarPaymentRequest,
  StellarProvider,
} from '../stellar.types';

export class DisabledStellarProvider implements StellarProvider {
  constructor(private readonly mode: string) {}

  async createPaymentRequest(_req: StellarPaymentRequest): Promise<never> {
    throw new Error(`Stellar provider is disabled (mode: ${this.mode}). Set STELLAR_MODE=testnet or live.`);
  }

  async findIncomingPayment(_req: StellarFindPaymentRequest): Promise<never> {
    throw new Error(`Stellar provider is disabled (mode: ${this.mode}).`);
  }

  async healthCheck() {
    return {
      status: 'down' as const,
      provider: this.mode,
      message: 'Stellar integration is disabled. Set STELLAR_MODE=testnet or live.',
    };
  }
}

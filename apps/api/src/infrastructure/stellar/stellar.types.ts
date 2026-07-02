/**
 * Purpose: Type contracts for the Stellar payment provider abstraction.
 * Why important: Decouples all Stellar-specific shapes from application logic.
 * Used by: stellar.client.ts, all stellar providers, stellar-purchase.service.ts
 */

export type ProviderHealth = {
  status: 'up' | 'degraded' | 'down';
  provider: string;
  message?: string;
};

export type StellarPaymentRequest = {
  memo: string;
  amountXLM: string;
};

export type StellarPaymentRequestResponse = {
  destinationAddress: string;
  memo: string;
  amountXLM: string;
  network: 'testnet' | 'mainnet';
};

export type StellarFindPaymentRequest = {
  memo: string;
  /**
   * The exact native-XLM amount the buyer was quoted for this memo. The live
   * provider verifies the on-chain amount against it; the testnet provider
   * echoes it so auto-completed settlements pass the same amount check.
   */
  expectedAmountXLM: string;
};

export type StellarPaymentRecord = {
  transactionHash: string;
  from: string;
  memo: string;
  settledAt: string;
  /**
   * Total native XLM actually received by the treasury for this memo. Callers
   * MUST verify this is >= the expected amount before granting credits.
   */
  amountXLM: string;
};

export interface StellarProvider {
  createPaymentRequest(req: StellarPaymentRequest): Promise<StellarPaymentRequestResponse>;
  findIncomingPayment(req: StellarFindPaymentRequest): Promise<StellarPaymentRecord | null>;
  healthCheck(): Promise<ProviderHealth>;
}

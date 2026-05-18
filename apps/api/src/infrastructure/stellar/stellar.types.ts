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
};

export type StellarPaymentRecord = {
  transactionHash: string;
  from: string;
  memo: string;
  settledAt: string;
};

export interface StellarProvider {
  createPaymentRequest(req: StellarPaymentRequest): Promise<StellarPaymentRequestResponse>;
  findIncomingPayment(req: StellarFindPaymentRequest): Promise<StellarPaymentRecord | null>;
  healthCheck(): Promise<ProviderHealth>;
}

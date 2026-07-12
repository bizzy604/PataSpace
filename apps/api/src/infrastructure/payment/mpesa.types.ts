/**
 * Purpose: Contract between the M-Pesa client and its providers (live,
 * sandbox, disabled): request/response shapes and outcome semantics.
 * Why important: settlement decisions hang off these fields; the null
 * semantics on resultCode are what keep "no answer" from reading as "paid".
 * Used by: mpesa.client.ts, providers/*, mpesa-purchase.service.ts,
 * commission-payout.job.ts.
 */
export type ProviderHealth = {
  status: 'up' | 'degraded' | 'down';
  provider: string;
  message?: string;
};

export type MpesaStkPushRequest = {
  phoneNumber: string;
  amount: number;
  accountReference: string;
};

export type MpesaB2CRequest = {
  phoneNumber: string;
  amount: number;
  remarks?: string;
  /**
   * Stable, caller-owned idempotency key. Pass the same value on every retry
   * of the same logical payout so Safaricom can dedupe instead of double-paying.
   * When omitted, the provider generates a one-shot id (legacy behaviour).
   */
  originatorConversationId?: string;
};

export type MpesaStkQueryRequest = {
  checkoutRequestId: string;
};

export type MpesaStkPushResponse = {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
};

export type MpesaB2CResponse = {
  conversationId: string;
  originatorConversationId: string;
  responseCode: string;
  responseDescription: string;
};

export type MpesaStkQueryResponse = {
  checkoutRequestId: string;
  responseCode: string;
  /**
   * Final Daraja result code, or null when Daraja gave no decision (the
   * field is absent while a transaction is still processing, and gateway
   * edge cases can drop or mangle it). Callers must treat null as "no
   * decision yet" — never as success or failure.
   */
  resultCode: number | null;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
};

export type MpesaB2CQueryRequest = {
  originatorConversationId: string;
};

/**
 * Outcome of a B2C transaction status query.
 *  - `success`: M-Pesa confirms the payout has been completed (idempotent)
 *  - `failed`: M-Pesa explicitly rejected the transaction (terminal)
 *  - `pending`: still in flight or status unknown — caller should treat as
 *    "no decision yet" and either retry later or re-issue with the same
 *    OriginatorConversationID (Safaricom will dedupe).
 *  - `unsupported`: provider does not implement the lookup; caller falls back
 *    to legacy retry behaviour.
 */
export type MpesaB2CQueryOutcome = 'success' | 'failed' | 'pending' | 'unsupported';

export type MpesaB2CQueryResponse = {
  outcome: MpesaB2CQueryOutcome;
  conversationId?: string;
  mpesaReceiptNumber?: string;
  resultDesc?: string;
};

export interface MpesaProvider {
  stkPush(payload: MpesaStkPushRequest): Promise<MpesaStkPushResponse>;
  b2c(payload: MpesaB2CRequest): Promise<MpesaB2CResponse>;
  queryStkPush(payload: MpesaStkQueryRequest): Promise<MpesaStkQueryResponse>;
  /**
   * Look up the status of a previously-issued B2C call by its
   * OriginatorConversationID. Critical for crash-safe payout retries — see
   * MpesaB2CQueryOutcome doc above.
   */
  queryB2CTransaction(payload: MpesaB2CQueryRequest): Promise<MpesaB2CQueryResponse>;
  healthCheck(): Promise<ProviderHealth>;
}

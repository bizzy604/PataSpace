/**
 * Purpose: Shared Daraja request plumbing for the live provider: config
 * shape, timestamp/password generation, MSISDN formatting, and defensive
 * result-code parsing.
 * Why important: parseResultCode is a money-truth guard — a missing or
 * unparseable ResultCode must read as "no decision", never as success.
 * Used by: live-mpesa.provider.ts.
 */
import { Buffer } from 'buffer';

export type LiveMpesaConfig = {
  baseUrl: string;
  callbackUrl: string;
  consumerKey: string;
  consumerSecret: string;
  initiatorName: string;
  passkey: string;
  resultUrl: string;
  securityCredential: string;
  shortcode: string;
  timeoutUrl: string;
};

export function darajaTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

// Daraja requires 2547XXXXXXXX — strip a leading '+' if present.
export function toMpesaPhone(phoneNumber: string): string {
  return phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
}

export function buildStkPushBody(
  config: LiveMpesaConfig,
  payload: { phoneNumber: string; amount: number; accountReference: string },
  timestamp: string,
) {
  return {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config.shortcode, config.passkey, timestamp),
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(payload.amount),
    PartyA: toMpesaPhone(payload.phoneNumber),
    PartyB: config.shortcode,
    PhoneNumber: toMpesaPhone(payload.phoneNumber),
    CallBackURL: config.callbackUrl,
    AccountReference: payload.accountReference,
    TransactionDesc: `PataSpace credits for ${payload.accountReference}`,
  };
}

export function buildB2CBody(
  config: LiveMpesaConfig,
  payload: { phoneNumber: string; amount: number; remarks?: string },
  originatorConversationId: string,
) {
  return {
    OriginatorConversationID: originatorConversationId,
    InitiatorName: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: 'BusinessPayment',
    Amount: Math.round(payload.amount),
    PartyA: config.shortcode,
    PartyB: toMpesaPhone(payload.phoneNumber),
    Remarks: payload.remarks ?? 'PataSpace commission payout',
    QueueTimeOutURL: config.timeoutUrl,
    ResultURL: config.resultUrl,
    Occasion: 'PataSpace payout',
  };
}

export function buildTransactionStatusBody(
  config: LiveMpesaConfig,
  originatorConversationId: string,
) {
  return {
    Initiator: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: 'TransactionStatusQuery',
    OriginatorConversationID: originatorConversationId,
    PartyA: config.shortcode,
    IdentifierType: '4',
    Remarks: 'PataSpace payout status check',
    QueueTimeOutURL: config.timeoutUrl,
    ResultURL: config.resultUrl,
    Occasion: 'PataSpace payout status check',
  };
}

/**
 * Daraja omits ResultCode while a transaction is still being processed, and
 * gateway edge cases can drop or mangle the field. Anything that is not an
 * explicit finite number maps to null — "no decision" — so callers cannot
 * mistake an ambiguous response for a settled one.
 */
export function parseResultCode(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Detects Safaricom's rejection of a reused OriginatorConversationID from a
 * B2C error response body. Daraja does not use a stable error code for this
 * across environments, so match on the message wording.
 */
export function isDuplicateSubmissionResponse(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { errorMessage, errorCode, ResponseDescription } = body as {
    errorMessage?: unknown;
    errorCode?: unknown;
    ResponseDescription?: unknown;
  };

  // Collapse to alphanumerics so "Duplicate Originator Conversation ID",
  // "duplicate OriginatorConversationID", etc. all match.
  const haystack = [errorMessage, errorCode, ResponseDescription]
    .filter((entry): entry is string => typeof entry === 'string')
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return haystack.includes('duplicate') && haystack.includes('originatorconversationid');
}

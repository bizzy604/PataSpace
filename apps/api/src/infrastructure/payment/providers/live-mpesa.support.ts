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

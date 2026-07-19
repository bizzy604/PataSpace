/**
 * Purpose: Generates the Idempotency-Key the API requires on
 * POST /credits/purchase — one key per top-up intent, reused verbatim when
 * the same intent is retried.
 * Why important: the key is what makes a timed-out or double-tapped top-up
 * replay the stored purchase instead of firing a second STK push.
 * Used by: mobile-app-provider initiatePurchase.
 */
export function newIdempotencyKey(): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (cryptoObject?.randomUUID) {
    return `topup-${cryptoObject.randomUUID()}`;
  }

  // Hermes builds without the crypto polyfill: uniqueness (not secrecy) is
  // what the key needs, so timestamp + random suffixes are sufficient.
  const random = () => Math.random().toString(36).slice(2, 10);
  return `topup-${Date.now().toString(36)}-${random()}${random()}`;
}

/**
 * Purpose: Pure math for the unlock confirmation sheet — the balance left after
 *   an unlock and the "≈ N% of monthly rent" line the design shows under the
 *   unlock cost. No React/RN imports so the node jest lane can test it.
 * Why important: The paywall must show the seeker an honest before/after, and
 *   the percentage is deterministic; keeping it in latent space would let the
 *   number drift. This is the source of truth for both.
 * Used by: screens/UnlockListingScreen.tsx and __tests__/unlock-summary.test.ts.
 */

/** Credits left after spending `cost` from `balance`, never below zero. */
export function balanceAfterUnlock(balance: number, cost: number): number {
  return Math.max(0, balance - cost);
}

/** Whether the wallet can cover the unlock cost. */
export function canAffordUnlock(balance: number, cost: number): boolean {
  return balance >= cost;
}

/**
 * Unlock cost as a whole-number percentage of monthly rent, for the
 * "≈ N% of monthly rent" caption. Returns null when rent is missing/zero so
 * the caller can hide the line instead of dividing by zero.
 */
export function unlockRentPercent(unlockCredits: number, monthlyRent: number): number | null {
  if (!monthlyRent || monthlyRent <= 0) return null;
  return Math.round((unlockCredits / monthlyRent) * 100);
}

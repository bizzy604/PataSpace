/**
 * Purpose: Pure decision for the M-Pesa processing screen's poll loop — given
 *   the wallet balance before the STK push, the latest polled balance, and how
 *   long we've waited, decide whether the top-up cleared, is still pending, or
 *   has run past the expected window. No React/RN imports so the node jest lane
 *   can test it.
 * Why important: The screen must only advance to "payment successful" once the
 *   server has actually credited the wallet (the M-Pesa callback does this),
 *   not on a user's self-attestation. Keeping the completion rule here makes it
 *   deterministic and testable instead of an eyeballed condition in the screen.
 * Used by: screens/CreditScreens.tsx (MpesaProcessingScreen) and
 *   __tests__/payments.test.ts.
 */

export type TopUpPollStatus = 'completed' | 'pending' | 'timed_out';

/**
 * The wallet has been credited iff the freshly polled balance is strictly
 * greater than the balance captured just before the STK push. The M-Pesa
 * callback credits server-side, so a rise is the authoritative signal.
 */
export function hasTopUpCleared(balanceBefore: number, currentBalance: number): boolean {
  return currentBalance > balanceBefore;
}

/**
 * Poll decision. 'completed' as soon as the balance rises; otherwise 'pending'
 * until `elapsedMs` reaches `timeoutMs`, after which 'timed_out' (the screen
 * keeps polling but surfaces a "taking longer than usual" note).
 */
export function topUpPollStatus(input: {
  balanceBefore: number;
  currentBalance: number;
  elapsedMs: number;
  timeoutMs: number;
}): TopUpPollStatus {
  if (hasTopUpCleared(input.balanceBefore, input.currentBalance)) return 'completed';
  if (input.elapsedMs >= input.timeoutMs) return 'timed_out';
  return 'pending';
}

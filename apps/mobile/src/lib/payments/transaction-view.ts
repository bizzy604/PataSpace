/**
 * Purpose: Pure view helpers for the transaction history screen — chip
 *   filtering, day grouping, and credit-direction sign parsing. Structural
 *   types only (no RN/alias imports) so the node jest lane can test them.
 * Why important: The history screen groups and filters an in-memory list; doing
 *   it in latent space would let the grouping/sign drift. This module is the
 *   deterministic source of truth the screen renders from.
 * Used by: screens/CreditScreens.tsx and __tests__/transaction-view.test.ts.
 */

/** Minimal shape this module needs; TransactionRecord satisfies it structurally. */
export type TransactionLike = {
  id: string;
  type: 'topup' | 'unlock' | 'referral' | 'support';
  date: string;
  credits: string;
  amount: string;
};

export type TransactionFilter = 'all' | 'topup' | 'unlock' | 'referral';

/** The chips shown above the list, in order. Value 'all' shows everything. */
export const transactionFilters: { key: TransactionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'topup', label: 'Credits Added' },
  { key: 'unlock', label: 'Unlocks' },
  { key: 'referral', label: 'Rewards' },
];

/** Filter by chip. 'all' is identity; every other key matches the record type. */
export function filterTransactions<T extends TransactionLike>(
  transactions: T[],
  filter: TransactionFilter,
): T[] {
  if (filter === 'all') return transactions;
  return transactions.filter((transaction) => transaction.type === filter);
}

/**
 * Group into day sections keyed by the record's `date` string, preserving the
 * order rows first appear (so "Just now"/"Today" stay above older dates without
 * needing a real date parse the seed data can't guarantee).
 */
export function groupTransactionsByDate<T extends TransactionLike>(
  transactions: T[],
): { date: string; items: T[] }[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const transaction of transactions) {
    const bucket = buckets.get(transaction.date);
    if (bucket) {
      bucket.push(transaction);
    } else {
      buckets.set(transaction.date, [transaction]);
      order.push(transaction.date);
    }
  }
  return order.map((date) => ({ date, items: buckets.get(date) as T[] }));
}

/**
 * Direction of the money move, read from the credits string's leading sign.
 * '+250 credits' -> 'in', '-150 credits'/'−150 credits' -> 'out', else 'none'.
 */
export function transactionDirection(transaction: TransactionLike): 'in' | 'out' | 'none' {
  const value = transaction.credits.trim();
  if (value.startsWith('+')) return 'in';
  if (value.startsWith('-') || value.startsWith('−')) return 'out';
  return 'none';
}

import { balanceAfterUnlock, canAffordUnlock, unlockRentPercent } from '../unlock-summary';
import { hasTopUpCleared, topUpPollStatus } from '../top-up-status';
import {
  filterTransactions,
  groupTransactionsByDate,
  transactionDirection,
  transactionFilters,
  type TransactionLike,
} from '../transaction-view';

describe('unlock-summary', () => {
  it('subtracts the cost and floors at zero', () => {
    expect(balanceAfterUnlock(5000, 2000)).toBe(3000);
    expect(balanceAfterUnlock(1000, 2000)).toBe(0);
  });

  it('gates affordability on balance >= cost', () => {
    expect(canAffordUnlock(2000, 2000)).toBe(true);
    expect(canAffordUnlock(1999, 2000)).toBe(false);
  });

  it('computes a whole-number rent percentage, null when rent is missing', () => {
    expect(unlockRentPercent(2000, 20000)).toBe(10);
    expect(unlockRentPercent(2000, 0)).toBeNull();
    expect(unlockRentPercent(2000, -5)).toBeNull();
  });
});

describe('top-up-status', () => {
  it('clears only when the polled balance rises above the pre-push balance', () => {
    expect(hasTopUpCleared(5000, 10000)).toBe(true);
    expect(hasTopUpCleared(5000, 5000)).toBe(false);
    expect(hasTopUpCleared(5000, 4000)).toBe(false);
  });

  it('reports completed as soon as the balance rises, regardless of elapsed time', () => {
    expect(
      topUpPollStatus({ balanceBefore: 5000, currentBalance: 10000, elapsedMs: 1000, timeoutMs: 120000 }),
    ).toBe('completed');
  });

  it('stays pending until the timeout, then reports timed_out (screen keeps polling)', () => {
    expect(
      topUpPollStatus({ balanceBefore: 5000, currentBalance: 5000, elapsedMs: 3000, timeoutMs: 120000 }),
    ).toBe('pending');
    expect(
      topUpPollStatus({ balanceBefore: 5000, currentBalance: 5000, elapsedMs: 120000, timeoutMs: 120000 }),
    ).toBe('timed_out');
  });
});

describe('transaction-view', () => {
  const txns: TransactionLike[] = [
    { id: 'a', type: 'topup', date: 'Today', credits: '+5,000 credits', amount: 'KES 5,000' },
    { id: 'b', type: 'unlock', date: 'Today', credits: '-150 credits', amount: 'KES 0' },
    { id: 'c', type: 'referral', date: 'Yesterday', credits: '+250 credits', amount: 'KES 0' },
    { id: 'd', type: 'unlock', date: 'Yesterday', credits: '−50 credits', amount: 'KES 0' },
  ];

  it('exposes four chips with All first', () => {
    expect(transactionFilters.map((chip) => chip.key)).toEqual([
      'all',
      'topup',
      'unlock',
      'referral',
    ]);
  });

  it('filters by chip and treats all as identity', () => {
    expect(filterTransactions(txns, 'all')).toHaveLength(4);
    expect(filterTransactions(txns, 'unlock').map((t) => t.id)).toEqual(['b', 'd']);
    expect(filterTransactions(txns, 'topup').map((t) => t.id)).toEqual(['a']);
  });

  it('groups by date preserving first-seen order', () => {
    const groups = groupTransactionsByDate(txns);
    expect(groups.map((g) => g.date)).toEqual(['Today', 'Yesterday']);
    expect(groups[0].items.map((t) => t.id)).toEqual(['a', 'b']);
    expect(groups[1].items.map((t) => t.id)).toEqual(['c', 'd']);
  });

  it('reads credit direction from the leading sign (both minus glyphs)', () => {
    expect(transactionDirection(txns[0])).toBe('in');
    expect(transactionDirection(txns[1])).toBe('out');
    expect(transactionDirection(txns[3])).toBe('out');
    expect(transactionDirection({ ...txns[0], credits: '0 credits' })).toBe('none');
  });
});

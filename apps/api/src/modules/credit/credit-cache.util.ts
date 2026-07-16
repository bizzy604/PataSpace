/**
 * Purpose: Single definition of the credit-balance cache key.
 * Why important: the read path (CreditQueryService) and every movement path
 * (CreditService.invalidateBalanceCache) must agree on this key or balance
 * displays go stale after settlements.
 * Used by: credit.service.ts, credit-query.service.ts.
 */
export function creditBalanceCacheKey(userId: string) {
  return `credit:balance:${userId}`;
}

/**
 * Purpose: Pure listing-related formatters shared by view-model mapping and
 *   the mock data module.
 * Why important: Keeps the listing mappers free of runtime imports from
 *   data/mock-listings (which pulls in native image assets), so the mappers
 *   stay testable in the plain-node gate-test lane.
 * Used by: lib/listings/listing-preview.ts, data/mock-listings.ts.
 */
export function formatCredits(amount: number) {
  return `${amount.toLocaleString()} credits`;
}

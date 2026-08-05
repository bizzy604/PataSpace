/**
 * Purpose: Accessibility label for a browse listing card.
 * Why important: The whole card is one button, so a screen reader announces one
 *   string for the photo, the price, the location, and the action. Building it
 *   here rather than inline keeps it deterministic and testable — the mobile
 *   jest lane transforms `.ts` only, so anything worth asserting has to live
 *   outside the `.tsx`.
 * Used by: components/ui/listing-card.tsx, lib/__tests__/listing-card-tap-target.test.ts.
 */

/**
 * Reads as "KES 25,000 per month, Kilimani, Nairobi. Taken. View Details."
 * Status is included because it is the difference between a house you can still
 * unlock and one that is gone, and a sighted user gets that from the pill.
 */
export function listingCardAccessibilityLabel(
  listing: { price: string; location: string; status: string },
  actionLabel: string,
): string {
  return `${listing.price} per month, ${listing.location}. ${listing.status}. ${actionLabel}`;
}

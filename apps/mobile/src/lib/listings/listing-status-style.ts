/**
 * Purpose: Maps a mobile listing status label to the pill classes the browse
 *   card renders — background fill and text colour, per status.
 * Why important: The pill was hardcoded `bg-success`, so a house locked to
 *   CONFIRMED rendered a green "Taken" badge that reads as available at a
 *   glance. Green is the availability signal on this card; a taken house must
 *   not wear it. Keeping this pure and separate means the colour rule is
 *   gate-testable without a renderer, the same way listing-card-a11y.ts is.
 * Used by: components/ui/listing-card.tsx.
 */
// Type-only import keeps this module runnable in the plain-node gate lane.
import type { ListingStatus } from '@/data/mock-listings';

export type ListingStatusPillClasses = {
  container: string;
  text: string;
};

/**
 * Every entry carries the same class shape (one bg-* and one text-*). css-interop
 * 0.2.6 crashes a mounted component that only starts setting CSS variables on a
 * later render, so a dynamically-selected class map must stay uniform in which
 * utility families it touches. See lib/__tests__/css-interop-upgrade.test.ts.
 */
const STATUS_PILL: Record<ListingStatus, ListingStatusPillClasses> = {
  // Available: green is reserved for these.
  Verified: { container: 'bg-success', text: 'text-white' },
  New: { container: 'bg-success', text: 'text-white' },
  Live: { container: 'bg-success', text: 'text-white' },
  // Attention, still available.
  Hot: { container: 'bg-danger', text: 'text-white' },
  // Not yet live: the poster is waiting on moderation.
  Review: { container: 'bg-warning', text: 'text-on-warning' },
  // Gone: both tenants confirmed the handover and unlock answers 410.
  Taken: { container: 'bg-surface-inverse', text: 'text-white' },
  Closed: { container: 'bg-muted', text: 'text-muted-foreground' },
};

export function listingStatusPillClasses(status: ListingStatus): ListingStatusPillClasses {
  return STATUS_PILL[status] ?? STATUS_PILL.Closed;
}

/**
 * A taken house is browsable but not unlockable, so every unlock affordance
 * keys off this rather than re-deriving the string comparison per screen.
 */
export function isListingTaken(status: ListingStatus): boolean {
  return status === 'Taken';
}

/**
 * Purpose: Pure policy for "may this listing be unlocked right now" — the
 * status allow-list plus the deleted/unapproved gates — and the single
 * LISTING_UNAVAILABLE error the paywall raises when it fails.
 * Why important: CONFIRMED means both tenants signed off and the house is
 * taken. Leaving it on the allow-list let a third tenant spend credits on a
 * house nobody could hand over, which is a refund the platform then owes.
 * Keeping the rule pure means it is testable without a database.
 * Used by: UnlockService.createUnlock (pre-check and the in-transaction
 * re-check), unlock-eligibility.policy.spec.ts.
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

/**
 * ACTIVE is open. UNLOCKED means at least one tenant has paid but no handover
 * is agreed yet, so it stays open — competing unlocks are the intended design.
 * CONFIRMED is deliberately absent: ListingHandoverService sets it once both
 * sides confirm, and from that moment the house is off the market.
 */
export const UNLOCKABLE_LISTING_STATUSES = [
  ListingStatus.ACTIVE,
  ListingStatus.UNLOCKED,
] as const;

export type UnlockableListingStatus = (typeof UNLOCKABLE_LISTING_STATUSES)[number];

export type ListingUnlockability = {
  isDeleted: boolean;
  isApproved: boolean;
  status: ListingStatus;
};

export function isUnlockableStatus(status: ListingStatus): status is UnlockableListingStatus {
  return UNLOCKABLE_LISTING_STATUSES.includes(status as UnlockableListingStatus);
}

export function isListingUnlockable(listing: ListingUnlockability): boolean {
  return !listing.isDeleted && listing.isApproved && isUnlockableStatus(listing.status);
}

/** HTTP 410 GONE: the listing existed, the client is not wrong, it is just over. */
export function listingUnavailableError(): HttpException {
  return new HttpException(
    {
      code: 'LISTING_UNAVAILABLE',
      message: 'Listing is no longer available for unlock',
    },
    HttpStatus.GONE,
  );
}

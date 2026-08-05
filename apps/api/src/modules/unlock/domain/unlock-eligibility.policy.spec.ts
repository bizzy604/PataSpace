/**
 * Purpose: Gate tests for the unlock eligibility policy — which listing states
 * may be paid for, and the shape of the refusal.
 * Why important: this predicate is the only thing stopping a tenant from
 * spending credits on a house that has already been handed over. The CONFIRMED
 * case is the regression this file exists to hold: it used to be unlockable,
 * which meant real credits spent on a dead listing.
 * Used by: `pnpm --filter @pataspace/api test`.
 */
import { HttpStatus } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import {
  isListingUnlockable,
  isUnlockableStatus,
  listingUnavailableError,
  UNLOCKABLE_LISTING_STATUSES,
} from './unlock-eligibility.policy';

const open = { isDeleted: false, isApproved: true };

describe('isUnlockableStatus', () => {
  it('allows the two open states', () => {
    expect(isUnlockableStatus(ListingStatus.ACTIVE)).toBe(true);
    expect(isUnlockableStatus(ListingStatus.UNLOCKED)).toBe(true);
  });

  // The whole point of the policy. A CONFIRMED listing has both signatures on
  // it, so the house is gone and no further credits may be taken for it.
  it('refuses CONFIRMED, because the house is already taken', () => {
    expect(isUnlockableStatus(ListingStatus.CONFIRMED)).toBe(false);
  });

  it.each([
    ListingStatus.PENDING,
    ListingStatus.COMPLETED,
    ListingStatus.DELETED,
    ListingStatus.REJECTED,
  ])('refuses %s', (status) => {
    expect(isUnlockableStatus(status)).toBe(false);
  });

  // Guards against someone widening the allow-list without reading the policy.
  it('keeps the allow-list to exactly ACTIVE and UNLOCKED', () => {
    expect([...UNLOCKABLE_LISTING_STATUSES]).toEqual([
      ListingStatus.ACTIVE,
      ListingStatus.UNLOCKED,
    ]);
  });
});

describe('isListingUnlockable', () => {
  it('accepts an approved, undeleted, ACTIVE listing', () => {
    expect(isListingUnlockable({ ...open, status: ListingStatus.ACTIVE })).toBe(true);
  });

  it('refuses a soft-deleted listing even when the status is open', () => {
    expect(
      isListingUnlockable({ isDeleted: true, isApproved: true, status: ListingStatus.ACTIVE }),
    ).toBe(false);
  });

  it('refuses an unapproved listing even when the status is open', () => {
    expect(
      isListingUnlockable({ isDeleted: false, isApproved: false, status: ListingStatus.ACTIVE }),
    ).toBe(false);
  });

  it('refuses a CONFIRMED listing that is otherwise healthy', () => {
    expect(isListingUnlockable({ ...open, status: ListingStatus.CONFIRMED })).toBe(false);
  });
});

describe('listingUnavailableError', () => {
  it('is a 410 GONE carrying the LISTING_UNAVAILABLE code', () => {
    const error = listingUnavailableError();

    expect(error.getStatus()).toBe(HttpStatus.GONE);
    expect(error.getResponse()).toEqual({
      code: 'LISTING_UNAVAILABLE',
      message: 'Listing is no longer available for unlock',
    });
  });
});

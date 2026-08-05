/**
 * Purpose: Gate tests for the both-sides-confirmed handover: the idempotent
 * listing lock, the winner exclusion, the ordering that closes the race, cache
 * invalidation, and the privileged context the RLS policies demand.
 * Why important: this is where credits stop being taken for a house that is
 * gone. Every assertion here maps to a way real money goes wrong: a double
 * refund, a refunded winner, a rival left paid-up, or a write silently dropped
 * by row-level security.
 * Used by: `pnpm --filter @pataspace/api test`.
 */
import { ConflictException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { HANDOVER_REFUND_REASON, ListingHandoverService } from './listing-handover.service';

function createHarness(claimCount = 1) {
  const prismaService = {
    listing: {
      updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
    },
  };
  const listingCacheService = {
    invalidateListing: jest.fn(),
    invalidateBrowse: jest.fn(),
  };
  const unlockRefundService = {
    refundUnlocksForListingInvalidation: jest.fn().mockResolvedValue({ refunded: [], failed: [] }),
  };
  // Mirrors RequestContextService.runInternal: runs the callback and records
  // that it was entered, so a test can prove the privileged wrapper is used.
  const requestContext = {
    runInternal: jest.fn(<T,>(fn: () => T): T => fn()),
  };

  const service = new ListingHandoverService(
    prismaService as never,
    listingCacheService as never,
    unlockRefundService as never,
    requestContext as never,
  );
  // `logger` is a private instance field, not on the prototype, so the spy has
  // to attach to this object. Silencing it also keeps the expected-error cases
  // from printing red noise into a passing run.
  const logError = jest
    .spyOn(service['logger'] as { error: (message: string) => void }, 'error')
    .mockImplementation(() => undefined);

  return {
    listingCacheService,
    logError,
    prismaService,
    requestContext,
    service,
    unlockRefundService,
  };
}

describe('ListingHandoverService', () => {
  it('locks the listing to CONFIRMED with a conditional claim', async () => {
    const { prismaService, service } = createHarness();

    await expect(service.handOverListing('listing_1', 'unlock_1')).resolves.toBe(true);

    // The `not: CONFIRMED` predicate IS the claim. A plain update would let two
    // concurrent settlements both proceed to refund the same rivals.
    expect(prismaService.listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'listing_1',
        status: { not: ListingStatus.CONFIRMED },
      },
      data: { status: ListingStatus.CONFIRMED },
    });
  });

  it('refunds every rival while excluding the winning unlock', async () => {
    const { service, unlockRefundService } = createHarness();

    await service.handOverListing('listing_1', 'unlock_winner');

    expect(unlockRefundService.refundUnlocksForListingInvalidation).toHaveBeenCalledWith(
      'listing_1',
      HANDOVER_REFUND_REASON,
      'unlock_winner',
    );
  });

  it('is idempotent: a second handover claims nothing and refunds nobody', async () => {
    const { listingCacheService, service, unlockRefundService } = createHarness(0);

    await expect(service.handOverListing('listing_1', 'unlock_1')).resolves.toBe(false);

    expect(unlockRefundService.refundUnlocksForListingInvalidation).not.toHaveBeenCalled();
    expect(listingCacheService.invalidateListing).not.toHaveBeenCalled();
    expect(listingCacheService.invalidateBrowse).not.toHaveBeenCalled();
  });

  it('drops both the listing and the browse caches so the feed stops advertising it', async () => {
    const { listingCacheService, service } = createHarness();

    await service.handOverListing('listing_1', 'unlock_1');

    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    expect(listingCacheService.invalidateBrowse).toHaveBeenCalled();
  });

  // listings_update_policy and unlocks_update_policy gate cross-user writes on
  // app.is_privileged(). The confirmer may be either tenant, but this writes the
  // owner's listing and other buyers' unlocks, so without runInternal the
  // updateMany matches zero rows and the handover silently does nothing.
  it('runs the whole handover inside the privileged internal context', async () => {
    const { prismaService, requestContext, service } = createHarness();
    const callOrder: string[] = [];

    requestContext.runInternal.mockImplementation(async (fn: () => unknown) => {
      callOrder.push('enter-internal');
      const result = await fn();
      callOrder.push('exit-internal');
      return result;
    });
    prismaService.listing.updateMany.mockImplementation(async () => {
      callOrder.push('update-listing');
      return { count: 1 };
    });

    await service.handOverListing('listing_1', 'unlock_1');

    expect(callOrder).toEqual(['enter-internal', 'update-listing', 'exit-internal']);
  });

  // Ordering is load-bearing: the lock has to land before the refunds, or a
  // rival unlock created in between gets neither a refund nor a usable listing.
  it('locks before it refunds', async () => {
    const { prismaService, service, unlockRefundService } = createHarness();
    const callOrder: string[] = [];

    prismaService.listing.updateMany.mockImplementation(async () => {
      callOrder.push('lock');
      return { count: 1 };
    });
    unlockRefundService.refundUnlocksForListingInvalidation.mockImplementation(async () => {
      callOrder.push('refund');
      return { refunded: [], failed: [] };
    });

    await service.handOverListing('listing_1', 'unlock_1');

    expect(callOrder).toEqual(['lock', 'refund']);
  });

  it('logs each unrefundable rival and still invalidates caches', async () => {
    const { listingCacheService, logError, service, unlockRefundService } = createHarness();

    unlockRefundService.refundUnlocksForListingInvalidation.mockResolvedValue({
      refunded: ['unlock_2'],
      failed: [{ unlockId: 'unlock_3', message: 'COMMISSION_ALREADY_PAID' }],
    });

    await expect(service.handOverListing('listing_1', 'unlock_1')).resolves.toBe(true);
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    // A rival left holding credits on a taken listing is a real discrepancy, so
    // it has to be findable in the logs by unlock id.
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('unlock_3'));
  });

  // A total sweep failure must not escape into the confirmation response. The
  // lock has already committed, so propagating would both 500 the tenant whose
  // confirmation succeeded and permanently skip these refunds: the retry finds
  // the listing already CONFIRMED and claims nothing.
  it('swallows a total refund-sweep failure and still completes the handover', async () => {
    const { listingCacheService, logError, service, unlockRefundService } = createHarness();

    unlockRefundService.refundUnlocksForListingInvalidation.mockRejectedValue(
      new ConflictException({ code: 'COMMISSION_ALREADY_PAID' }),
    );

    await expect(service.handOverListing('listing_1', 'unlock_1')).resolves.toBe(true);
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('rival refund sweep failed'));
  });
});

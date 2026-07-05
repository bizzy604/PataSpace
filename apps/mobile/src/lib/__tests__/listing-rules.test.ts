/**
 * Purpose: Gate tests for the client-side photo-count rule.
 * Why important: This rule must stay in lockstep with the contract's
 *   createListingSchema (photos min/max); a drift here sends users back into
 *   the "upload everything, then fail validation" trap.
 * Used by: apps/mobile test lane (pnpm --filter @pataspace/mobile test).
 */
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  captureMoreLabel,
  hasEnoughPhotos,
  photosStillNeeded,
} from '../listing-rules';

describe('photo-count rule', () => {
  it('matches the contract bounds', () => {
    expect(MIN_LISTING_PHOTOS).toBe(5);
    expect(MAX_LISTING_PHOTOS).toBe(15);
  });

  it('counts remaining photos down to zero', () => {
    expect(photosStillNeeded(0)).toBe(MIN_LISTING_PHOTOS);
    expect(photosStillNeeded(1)).toBe(MIN_LISTING_PHOTOS - 1);
    expect(photosStillNeeded(MIN_LISTING_PHOTOS)).toBe(0);
    expect(photosStillNeeded(MIN_LISTING_PHOTOS + 3)).toBe(0);
  });

  it('gates submit below the minimum and above the maximum', () => {
    expect(hasEnoughPhotos(MIN_LISTING_PHOTOS - 1)).toBe(false);
    expect(hasEnoughPhotos(MIN_LISTING_PHOTOS)).toBe(true);
    expect(hasEnoughPhotos(MAX_LISTING_PHOTOS)).toBe(true);
    expect(hasEnoughPhotos(MAX_LISTING_PHOTOS + 1)).toBe(false);
  });

  it('pluralises the capture label', () => {
    expect(captureMoreLabel(MIN_LISTING_PHOTOS - 1)).toBe('Capture 1 more photo');
    expect(captureMoreLabel(0)).toBe(`Capture ${MIN_LISTING_PHOTOS} more photos`);
  });

  it('tells the user to remove photos above the maximum', () => {
    expect(captureMoreLabel(MAX_LISTING_PHOTOS + 1)).toBe(
      `Remove 1 photo (max ${MAX_LISTING_PHOTOS})`,
    );
    expect(captureMoreLabel(MAX_LISTING_PHOTOS + 2)).toBe(
      `Remove 2 photos (max ${MAX_LISTING_PHOTOS})`,
    );
  });
});

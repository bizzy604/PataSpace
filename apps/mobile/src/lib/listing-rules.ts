/**
 * Purpose: Client-side enforcement of the listing contract's photo-count rule.
 * Why important: The API rejects listings with fewer than MIN_LISTING_PHOTOS
 *   photos; gating the UI here stops users from uploading media only to hit
 *   a validation error at the final step.
 * Used by: PhotoReviewScreen and ListingReviewScreen (submit gates).
 */
import { MAX_LISTING_PHOTOS, MIN_LISTING_PHOTOS } from '@pataspace/contracts';

export { MAX_LISTING_PHOTOS, MIN_LISTING_PHOTOS };

/** How many more photos the user must capture before submit unlocks. */
export function photosStillNeeded(photoCount: number): number {
  return Math.max(0, MIN_LISTING_PHOTOS - photoCount);
}

export function hasEnoughPhotos(photoCount: number): boolean {
  return photoCount >= MIN_LISTING_PHOTOS && photoCount <= MAX_LISTING_PHOTOS;
}

/**
 * Button label for the photo gate, e.g. "Capture 3 more photos" below the
 * minimum or "Remove 2 photos (max 15)" above the maximum.
 */
export function captureMoreLabel(photoCount: number): string {
  if (photoCount > MAX_LISTING_PHOTOS) {
    const excess = photoCount - MAX_LISTING_PHOTOS;

    return `Remove ${excess} photo${excess === 1 ? '' : 's'} (max ${MAX_LISTING_PHOTOS})`;
  }

  const needed = photosStillNeeded(photoCount);

  return `Capture ${needed} more photo${needed === 1 ? '' : 's'}`;
}

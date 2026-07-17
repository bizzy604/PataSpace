/**
 * Purpose: Pure helpers that fold a fetched ListingDetails response into the
 *   ListingPreview view model — real gallery photos, photo count, cover image,
 *   amenities, and description replace the thin feed-card placeholders.
 * Why important: The feed endpoint carries no media beyond a thumbnail; every
 *   detail/gallery screen relies on this merge to show the poster's actual
 *   photos and video instead of an empty gallery.
 * Used by: ListingDetailsScreen, ListingGalleryScreen, MyListingDetailsScreen
 *   via features/mobile-app/use-listing-details.ts.
 */
// Type-only imports keep this module runnable in the plain-node gate lane.
import type { ListingDetails } from '@pataspace/contracts';
import type { ListingMedia, ListingPreview } from '@/data/mock-listings';
import { listingCardToPreview } from './listing-preview';

export function detailsToGalleryMedia(details: ListingDetails): ListingMedia[] {
  return [...details.photos]
    .sort((a, b) => a.order - b.order)
    .map((photo, index) => ({
      id: `photo-${photo.order}`,
      label: `Photo ${index + 1}`,
      source: { uri: photo.url },
    }));
}

export function specChips(meta: string): string[] {
  return meta
    .split('|')
    .map((part) => part.trim())
    .filter((part) => !/unlock/i.test(part));
}

/**
 * Merge a fetched detail payload over the (possibly missing) feed preview.
 * When the feed never delivered the listing — an owner viewing their own
 * pending listing, or a stale feed — the preview is rebuilt entirely from the
 * detail response, so the screen still renders.
 */
export function mergeListingDetails(
  preview: ListingPreview | undefined,
  details: ListingDetails | null | undefined,
): ListingPreview | undefined {
  if (!details) {
    return preview;
  }

  const base = preview ?? listingCardToPreview(details);
  const galleryMedia = detailsToGalleryMedia(details);
  const coverImage = galleryMedia[0]?.source ?? base.coverImage;

  return {
    ...base,
    blurb: details.description || base.blurb,
    amenities: details.amenities.length > 0 ? details.amenities : base.amenities,
    galleryMedia,
    photoCount: `${galleryMedia.length} photos`,
    coverImage,
  };
}

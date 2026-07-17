/**
 * Purpose: Gate tests for the detail-to-preview merge that puts real S3 media
 *   into the gallery view model.
 * Why important: Field testing 2026-07-16 found approved listings rendering
 *   with empty galleries and demo copy; these tests pin the merge behavior so
 *   an API listing always surfaces its fetched photos, count, and cover.
 * Used by: `pnpm --filter @pataspace/mobile test` (gate lane).
 */
import type { ListingDetails } from '@pataspace/contracts';
import { detailsToGalleryMedia, mergeListingDetails, specChips } from '../listing-details-view';
import { listingCardToPreview } from '../listing-preview';

function buildDetails(overrides: Partial<ListingDetails> = {}): ListingDetails {
  return {
    id: 'listing-1',
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 28000,
    bedrooms: 2,
    bathrooms: 1,
    houseType: 'TWO_BEDROOM' as ListingDetails['houseType'],
    propertyType: 'Apartment',
    furnished: false,
    availableFrom: '2026-08-01T00:00:00.000Z',
    unlockCostCredits: 500,
    successFeeKes: 2800,
    landlordAware: true,
    posterRole: 'OUTGOING_TENANT' as ListingDetails['posterRole'],
    thumbnailUrl: 'https://cdn.example.com/listings/u1/photos/1.jpg',
    viewCount: 12,
    unlockCount: 1,
    isUnlocked: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    mapLocation: { approxLatitude: -1.29, approxLongitude: 36.79 },
    description: 'Bright two bedroom with balcony and reliable water.',
    amenities: ['Water 24/7', 'Parking'],
    photos: [
      { url: 'https://cdn.example.com/listings/u1/photos/2.jpg', order: 2 },
      { url: 'https://cdn.example.com/listings/u1/photos/1.jpg', order: 1 },
    ],
    video: { url: 'https://cdn.example.com/listings/u1/videos/walkthrough.mp4' },
    tenant: { firstName: 'Amoni', joinedDate: '2025-01-01T00:00:00.000Z', listingsPosted: 2 },
    ...overrides,
  };
}

describe('detailsToGalleryMedia', () => {
  it('maps photos sorted by order into gallery media with uri sources', () => {
    const media = detailsToGalleryMedia(buildDetails());

    expect(media.map((item) => item.source)).toEqual([
      { uri: 'https://cdn.example.com/listings/u1/photos/1.jpg' },
      { uri: 'https://cdn.example.com/listings/u1/photos/2.jpg' },
    ]);
    expect(media[0]!.label).toBe('Photo 1');
  });

  it('returns an empty gallery when the listing has no photos', () => {
    expect(detailsToGalleryMedia(buildDetails({ photos: [] }))).toEqual([]);
  });
});

describe('mergeListingDetails', () => {
  it('patches an existing preview with fetched gallery, count, cover, and description', () => {
    const preview = listingCardToPreview(buildDetails());
    const merged = mergeListingDetails(preview, buildDetails());

    expect(merged).toBeDefined();
    expect(merged!.galleryMedia).toHaveLength(2);
    expect(merged!.photoCount).toBe('2 photos');
    expect(merged!.coverImage).toEqual({ uri: 'https://cdn.example.com/listings/u1/photos/1.jpg' });
    expect(merged!.blurb).toBe('Bright two bedroom with balcony and reliable water.');
    expect(merged!.amenities).toEqual(['Water 24/7', 'Parking']);
  });

  it('builds a full preview from details when the feed never delivered the listing', () => {
    const merged = mergeListingDetails(undefined, buildDetails());

    expect(merged).toBeDefined();
    expect(merged!.id).toBe('listing-1');
    expect(merged!.title).toBe('2BR · Kilimani');
    expect(merged!.galleryMedia).toHaveLength(2);
  });

  it('returns the untouched preview when there is no detail payload yet', () => {
    const preview = listingCardToPreview(buildDetails());

    expect(mergeListingDetails(preview, null)).toBe(preview);
    expect(mergeListingDetails(undefined, undefined)).toBeUndefined();
  });

  it('keeps the base cover and amenities when details carry no media', () => {
    const preview = listingCardToPreview(buildDetails());
    const merged = mergeListingDetails(preview, buildDetails({ photos: [], amenities: [] }));

    expect(merged!.coverImage).toEqual(preview.coverImage);
    expect(merged!.photoCount).toBe('0 photos');
    expect(merged!.amenities).toEqual(preview.amenities);
  });
});

describe('specChips', () => {
  it('splits meta and drops unlock chips', () => {
    expect(specChips('2 bed  |  Nairobi  |  Unlock for 500')).toEqual(['2 bed', 'Nairobi']);
  });
});

/**
 * Purpose: Gate-test that listingCardToPreview maps the API's ListingStatus
 *   enum to the mobile status label, and that CONFIRMED listings show as Taken.
 * Why important: The card carries status so clients can render a taken house as
 *   "Taken" and disable its unlock CTA (contracts comment at listing.ts:157);
 *   without this the UI invites a spend on a 410 LISTING_UNAVAILABLE.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import { ListingStatus } from '@pataspace/contracts';
import { statusLabel, listingCardToPreview } from '../listing-preview';
import type { ListingCard } from '@pataspace/contracts';

describe('statusLabel', () => {
  it('maps ACTIVE to Live', () => {
    expect(statusLabel(ListingStatus.ACTIVE)).toBe('Live');
  });

  it('maps UNLOCKED to Live', () => {
    expect(statusLabel(ListingStatus.UNLOCKED)).toBe('Live');
  });

  it('maps CONFIRMED to Taken', () => {
    expect(statusLabel(ListingStatus.CONFIRMED)).toBe('Taken');
  });

  it('maps PENDING to Review', () => {
    expect(statusLabel(ListingStatus.PENDING)).toBe('Review');
  });

  it('maps COMPLETED to Closed', () => {
    expect(statusLabel(ListingStatus.COMPLETED)).toBe('Closed');
  });

  it('maps DELETED to Closed', () => {
    expect(statusLabel(ListingStatus.DELETED)).toBe('Closed');
  });

  it('maps REJECTED to Closed', () => {
    expect(statusLabel(ListingStatus.REJECTED)).toBe('Closed');
  });
});

describe('listingCardToPreview', () => {
  const baseCard: ListingCard = {
    id: 'test-1',
    status: ListingStatus.ACTIVE,
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    bedrooms: 2,
    bathrooms: 1,
    houseType: 'TWO_BEDROOM' as any,
    propertyType: 'Apartment',
    furnished: false,
    availableFrom: '2026-09-01',
    unlockCostCredits: 500,
    successFeeKes: 25000,
    landlordAware: true,
    posterRole: 'OUTGOING_TENANT' as any,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    viewCount: 42,
    unlockCount: 3,
    isUnlocked: false,
    createdAt: '2026-08-01T10:00:00Z',
    mapLocation: { approxLatitude: -1.28, approxLongitude: 36.82 },
    tenant: { firstName: 'John', joinedDate: '2025-01-15T00:00:00Z' },
  };

  it('uses the mapped status label, not the raw enum', () => {
    const preview = listingCardToPreview(baseCard);
    expect(preview.status).toBe('Live');
  });

  it('shows CONFIRMED listings as Taken', () => {
    const preview = listingCardToPreview({ ...baseCard, status: ListingStatus.CONFIRMED });
    expect(preview.status).toBe('Taken');
  });

  it('shows PENDING listings as Review', () => {
    const preview = listingCardToPreview({ ...baseCard, status: ListingStatus.PENDING });
    expect(preview.status).toBe('Review');
  });

  it('shows DELETED listings as Closed', () => {
    const preview = listingCardToPreview({ ...baseCard, status: ListingStatus.DELETED });
    expect(preview.status).toBe('Closed');
  });
});

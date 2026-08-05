/**
 * Purpose: Gate-test the listing card/details contract, specifically that a
 *   card always carries its lifecycle `status`.
 * Why important: The API locks a listing to CONFIRMED when both tenants
 *   confirm the handover, and then answers 410 LISTING_UNAVAILABLE on unlock.
 *   If `status` ever falls out of the card contract the clients go back to
 *   rendering a taken house as Live with an active unlock CTA, which invites a
 *   credit spend that can only fail.
 * Used by: `pnpm --filter @pataspace/contracts test`.
 */
import { listingCardSchema, listingDetailsSchema } from '../listing';
import { ListingHouseType, ListingStatus, PosterRole } from '../../enums';

const validCard = {
  id: 'listing_1',
  status: ListingStatus.ACTIVE,
  county: 'Nairobi',
  neighborhood: 'Kilimani',
  monthlyRent: 25000,
  bedrooms: 2,
  bathrooms: 1,
  houseType: ListingHouseType.TWO_BEDROOM,
  propertyType: 'Apartment',
  furnished: false,
  availableFrom: '2026-05-01T00:00:00.000Z',
  unlockCostCredits: 300,
  successFeeKes: 2500,
  landlordAware: true,
  posterRole: PosterRole.OUTGOING_TENANT,
  viewCount: 0,
  unlockCount: 0,
  isUnlocked: false,
  createdAt: '2026-03-20T10:00:00.000Z',
  mapLocation: { approxLatitude: -1.29, approxLongitude: 36.79 },
  tenant: { firstName: 'Amoni', joinedDate: '2026-01-01T00:00:00.000Z' },
};

describe('listingCardSchema', () => {
  it('accepts a card carrying its lifecycle status', () => {
    const parsed = listingCardSchema.parse(validCard);
    expect(parsed.status).toBe(ListingStatus.ACTIVE);
  });

  it('rejects a card with no status', () => {
    const { status: _status, ...withoutStatus } = validCard;
    expect(listingCardSchema.safeParse(withoutStatus).success).toBe(false);
  });

  it('rejects a status outside the ListingStatus enum', () => {
    expect(listingCardSchema.safeParse({ ...validCard, status: 'TAKEN' }).success).toBe(false);
  });

  it.each([
    ListingStatus.ACTIVE,
    ListingStatus.UNLOCKED,
    ListingStatus.CONFIRMED,
    ListingStatus.COMPLETED,
    ListingStatus.PENDING,
    ListingStatus.REJECTED,
    ListingStatus.DELETED,
  ])('carries %s through unchanged', (status) => {
    expect(listingCardSchema.parse({ ...validCard, status }).status).toBe(status);
  });
});

describe('listingDetailsSchema', () => {
  const validDetails = {
    ...validCard,
    status: ListingStatus.CONFIRMED,
    description: 'Spacious 2BR with balcony and good natural light.',
    amenities: ['Water', 'Parking'],
    photos: [],
    tenant: { ...validCard.tenant, listingsPosted: 3 },
  };

  it('inherits status from the card schema', () => {
    expect(listingDetailsSchema.parse(validDetails).status).toBe(ListingStatus.CONFIRMED);
  });

  it('rejects details with no status', () => {
    const { status: _status, ...withoutStatus } = validDetails;
    expect(listingDetailsSchema.safeParse(withoutStatus).success).toBe(false);
  });
});

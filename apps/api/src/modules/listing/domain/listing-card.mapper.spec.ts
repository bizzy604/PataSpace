/**
 * Purpose: Gate tests for the shared listing-card projection.
 * Why important: this mapper is the only place browse, details, and saved
 * listings agree on what a card contains. The status passthrough is the one
 * that costs money if it breaks: drop it and a CONFIRMED (taken) house renders
 * as Live with a live unlock CTA that can only answer 410.
 * Used by: `npx jest src/modules/listing/domain/listing-card.mapper.spec.ts`.
 */
import {
  ListingHouseType as PrismaListingHouseType,
  ListingStatus as PrismaListingStatus,
  PosterRole as PrismaPosterRole,
} from '@prisma/client';
import { ListingStatus as ContractListingStatus } from '@pataspace/contracts';
import { listingCardSchema } from '@pataspace/contracts';
import {
  buildMapLocation,
  ListingCardSource,
  roundCoordinate,
  toListingCardFields,
} from './listing-card.mapper';

function createListing(overrides: Partial<ListingCardSource> = {}): ListingCardSource {
  return {
    id: 'listing_1',
    status: PrismaListingStatus.ACTIVE,
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    bedrooms: 2,
    bathrooms: 1,
    houseType: PrismaListingHouseType.TWO_BEDROOM,
    propertyType: 'Apartment',
    furnished: false,
    availableFrom: new Date('2026-05-01T00:00:00.000Z'),
    unlockCostCredits: 300,
    successFeeKes: 2500,
    landlordAware: true,
    posterRole: PrismaPosterRole.OUTGOING_TENANT,
    thumbnailUrl: null,
    viewCount: 4,
    unlockCount: 2,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    latitude: -1.2987654,
    longitude: 36.7891234,
    user: {
      firstName: 'Amoni',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    ...overrides,
  };
}

describe('toListingCardFields', () => {
  it('produces a card the shared contract accepts', () => {
    const card = toListingCardFields(createListing(), false);

    expect(listingCardSchema.safeParse(card).success).toBe(true);
  });

  it.each([
    PrismaListingStatus.ACTIVE,
    PrismaListingStatus.UNLOCKED,
    PrismaListingStatus.CONFIRMED,
    PrismaListingStatus.COMPLETED,
    PrismaListingStatus.PENDING,
  ])('passes %s through to the client unchanged', (status) => {
    const card = toListingCardFields(createListing({ status }), false);

    expect(card.status).toBe(status as unknown as ContractListingStatus);
  });

  it('marks a taken listing CONFIRMED so clients can render it as Taken', () => {
    const card = toListingCardFields(
      createListing({ status: PrismaListingStatus.CONFIRMED }),
      false,
    );

    expect(card.status).toBe(ContractListingStatus.CONFIRMED);
  });

  it('takes isUnlocked from the caller, not the row', () => {
    const listing = createListing();

    expect(toListingCardFields(listing, true).isUnlocked).toBe(true);
    expect(toListingCardFields(listing, false).isUnlocked).toBe(false);
  });

  it('blurs the coordinates to two decimals so the address stays paid-for', () => {
    const card = toListingCardFields(createListing(), false);

    expect(card.mapLocation).toEqual({ approxLatitude: -1.3, approxLongitude: 36.79 });
  });

  it('serialises dates as ISO strings', () => {
    const card = toListingCardFields(createListing(), false);

    expect(card.availableFrom).toBe('2026-05-01T00:00:00.000Z');
    expect(card.createdAt).toBe('2026-03-20T10:00:00.000Z');
    expect(card.tenant.joinedDate).toBe('2026-01-01T00:00:00.000Z');
  });

  it('turns a null thumbnail into an absent one, since the contract is optional', () => {
    expect(toListingCardFields(createListing({ thumbnailUrl: null }), false).thumbnailUrl).toBe(
      undefined,
    );
    expect(
      toListingCardFields(createListing({ thumbnailUrl: 'https://cdn/1.jpg' }), false).thumbnailUrl,
    ).toBe('https://cdn/1.jpg');
  });

  it('exposes the poster preview without leaking the owner id', () => {
    const card = toListingCardFields(createListing(), false);

    expect(card.tenant).toEqual({
      firstName: 'Amoni',
      joinedDate: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('roundCoordinate', () => {
  it.each([
    [-1.2987654, -1.3],
    [36.7891234, 36.79],
    [0, 0],
    [-1.236, -1.24],
    [-1.234, -1.23],
  ])('rounds %p to %p', (input, expected) => {
    expect(roundCoordinate(input)).toBe(expected);
  });

  // Two float quirks pinned so nobody "fixes" them into a coordinate shift.
  // 1. Math.round breaks exact ties toward +Infinity, so -0.005 lands on -0,
  //    not -0.01. JSON.stringify writes that as `0`, which is correct enough
  //    for an already-blurred pin but surprising if you expect symmetry.
  // 2. Most decimal halves are not exact after `value * 100` (-1.235 becomes
  //    -123.50000000000001), so they round away from zero instead. The two
  //    rules disagree, and only the exact-tie case follows rule 1.
  it('handles float ties the way Math.round actually does', () => {
    expect(Object.is(roundCoordinate(-0.005), -0)).toBe(true);
    expect(roundCoordinate(0.005)).toBe(0.01);
    expect(roundCoordinate(-1.235)).toBe(-1.24);
    expect(roundCoordinate(1.235)).toBe(1.24);
  });
});

describe('buildMapLocation', () => {
  it('rounds both axes', () => {
    expect(buildMapLocation(-1.2987654, 36.7891234)).toEqual({
      approxLatitude: -1.3,
      approxLongitude: 36.79,
    });
  });
});

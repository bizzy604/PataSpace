/**
 * Purpose: The single Prisma-row to ListingCard projection, including the
 * blurred public map location and the lifecycle status clients need to render
 * a taken house.
 * Why important: browse, details, and saved listings all hand back the same
 * card. Three hand-written copies of the same twenty fields is how one surface
 * silently drifts from the others, and here that drift has a price: a listing
 * locked to CONFIRMED would keep advertising an unlock CTA that can only
 * answer 410, so a tenant is invited to spend credits on a house that is gone.
 * Used by: ListingService.browseListings, ListingService.getListingDetails,
 * SavedListingService.toRecord, listing-card.mapper.spec.ts.
 */
import {
  ListingHouseType as PrismaListingHouseType,
  ListingStatus as PrismaListingStatus,
  PosterRole as PrismaPosterRole,
} from '@prisma/client';
import {
  ListingCard,
  ListingHouseType as ContractListingHouseType,
  ListingMapLocation,
  ListingStatus as ContractListingStatus,
  PosterRole as ContractPosterRole,
} from '@pataspace/contracts';

/**
 * The exact address is the paid product, so a public card carries two decimals
 * of latitude/longitude only, roughly a 1km square.
 */
export const PUBLIC_MAP_COORDINATE_DECIMALS = 2;

/** The listing columns and relation every card projection reads. */
export type ListingCardSource = {
  id: string;
  status: PrismaListingStatus;
  county: string;
  neighborhood: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  houseType: PrismaListingHouseType;
  propertyType: string;
  furnished: boolean;
  availableFrom: Date;
  unlockCostCredits: number;
  successFeeKes: number;
  landlordAware: boolean;
  posterRole: PrismaPosterRole;
  thumbnailUrl: string | null;
  viewCount: number;
  unlockCount: number;
  createdAt: Date;
  latitude: number;
  longitude: number;
  user: {
    firstName: string;
    createdAt: Date;
  };
};

export function roundCoordinate(
  value: number,
  decimals: number = PUBLIC_MAP_COORDINATE_DECIMALS,
): number {
  const precision = 10 ** decimals;

  return Math.round(value * precision) / precision;
}

export function buildMapLocation(latitude: number, longitude: number): ListingMapLocation {
  return {
    approxLatitude: roundCoordinate(latitude),
    approxLongitude: roundCoordinate(longitude),
  };
}

/**
 * `isUnlocked` is the caller's decision, not the row's: browse derives it from
 * the viewer's unlock set, details from whether the viewer may see contact
 * info, and saved listings from the same unlock set as browse.
 */
export function toListingCardFields(listing: ListingCardSource, isUnlocked: boolean): ListingCard {
  return {
    id: listing.id,
    status: listing.status as unknown as ContractListingStatus,
    county: listing.county,
    neighborhood: listing.neighborhood,
    monthlyRent: listing.monthlyRent,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    houseType: listing.houseType as unknown as ContractListingHouseType,
    propertyType: listing.propertyType,
    furnished: listing.furnished,
    availableFrom: listing.availableFrom.toISOString(),
    unlockCostCredits: listing.unlockCostCredits,
    successFeeKes: listing.successFeeKes,
    landlordAware: listing.landlordAware,
    posterRole: listing.posterRole as unknown as ContractPosterRole,
    thumbnailUrl: listing.thumbnailUrl ?? undefined,
    viewCount: listing.viewCount,
    unlockCount: listing.unlockCount,
    isUnlocked,
    createdAt: listing.createdAt.toISOString(),
    mapLocation: buildMapLocation(listing.latitude, listing.longitude),
    tenant: {
      firstName: listing.user.firstName,
      joinedDate: listing.user.createdAt.toISOString(),
    },
  };
}

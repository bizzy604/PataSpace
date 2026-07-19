/**
 * Purpose: Pure mapping from the API's ListingCard contract to the mobile
 *   ListingPreview view model the screens render.
 * Why important: Single place the feed-card shape is adapted for the UI, so
 *   the sync hook and the detail-merge path produce identical previews. All
 *   imports are type-only, keeping this testable in the plain-node gate lane.
 * Used by: features/mobile-app/use-mobile-api-sync.ts and
 *   lib/listings/listing-details-view.ts.
 */
import type { ListingCard } from '@pataspace/contracts';
import type { ListingPreview } from '@/data/mock-listings';
import { formatCredits } from './format';

// Empty uri renders the card's neutral surface — never a placeholder photo of
// a different property (that read as fake data in field testing).
const EMPTY_COVER: ListingPreview['coverImage'] = { uri: '' };

export function listingCardToPreview(card: ListingCard): ListingPreview {
  const bedrooms = card.bedrooms;
  const bedLabel = bedrooms === 0 ? 'Studio' : bedrooms === 1 ? '1 bed' : `${bedrooms} bed`;
  const title =
    bedrooms === 0 ? `Studio · ${card.neighborhood}` : `${bedrooms}BR · ${card.neighborhood}`;

  return {
    id: card.id,
    title,
    monthlyRent: card.monthlyRent,
    price: `KES ${card.monthlyRent.toLocaleString()}/mo`,
    unlockCostCredits: card.unlockCostCredits,
    unlockCost: formatCredits(card.unlockCostCredits),
    successFeeKes: card.successFeeKes,
    commissionAmount: `KES ${Math.round(card.successFeeKes * 0.7).toLocaleString()}`,
    county: card.county,
    houseType: card.houseType,
    area: card.neighborhood,
    location: `${card.neighborhood}, ${card.county}`,
    directions: 'Directions revealed after unlock.',
    meta: `${bedLabel}  |  ${card.county}  |  ${card.furnished ? 'Furnished' : card.propertyType}`,
    blurb: `${card.propertyType} in ${card.neighborhood}. Available from ${card.availableFrom}.`,
    status: 'Live',
    coverImage: card.thumbnailUrl ? { uri: card.thumbnailUrl } : EMPTY_COVER,
    photoCount: '— photos',
    imageHint: card.neighborhood,
    availableFrom: card.availableFrom,
    deposit: 'Contact for details',
    moveReason: '',
    tags: card.furnished ? ['Furnished'] : [],
    amenities: [],
    galleryMedia: [],
    mapLocation: card.mapLocation,
    quote: '',
    quoteAuthor: '',
    stats: {
      views: String(card.viewCount),
      unlocks: String(card.unlockCount),
      saves: '—',
      freshness: new Date(card.createdAt).toLocaleDateString('en-KE'),
    },
  };
}

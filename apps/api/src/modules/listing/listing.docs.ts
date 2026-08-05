/**
 * Purpose: Barrel re-exporting the listing module's Swagger models from `docs/`.
 * Why important: Keeps `ListingController` and `admin.docs.ts` importing one
 *   path while the models live in three files under the 200-line ceiling
 *   (`.claude/rules/backend-modular-monolith.md`).
 * Used by: ListingController, modules/admin/admin.docs.ts.
 */
export {
  CreateListingRequestDto,
  ListingPhotoInputDto,
  ListingVideoInputDto,
  SeedListingFromConfirmationRequestDto,
  UpdateListingRequestDto,
} from './docs/listing-request.docs';

export {
  ListingCardDto,
  ListingContactInfoDto,
  ListingDetailsDto,
  ListingMapLocationDto,
  ListingPhotoDto,
  ListingTenantDetailsDto,
  ListingTenantPreviewDto,
  ListingVideoDto,
} from './docs/listing-card.docs';

export {
  BrowseListingsResponseDto,
  CreateListingResponseDto,
  ListingPaginationDto,
  MyListingCommissionSummaryDto,
  MyListingDto,
  MyListingsResponseDto,
  SeedListingFromConfirmationResponseDto,
  UpdateListingResponseDto,
} from './docs/listing-response.docs';

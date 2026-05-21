/**
 * Purpose: Swagger DTOs for the saved-listing module HTTP surface.
 * Why important: Drives /docs documentation for the saved-listings endpoints.
 * Used by: SavedListingController.
 */
import { ApiProperty } from '@nestjs/swagger';

export class SaveListingRequestDto {
  @ApiProperty({ example: 'cm8listing123' })
  listingId!: string;
}

class SavedListingCardTenantDto {
  @ApiProperty({ example: 'Amina' })
  firstName!: string;

  @ApiProperty({ example: '2025-12-09T00:00:00.000Z' })
  joinedDate!: string;
}

class SavedListingCardMapLocationDto {
  @ApiProperty({ example: -1.29 })
  approxLatitude!: number;

  @ApiProperty({ example: 36.79 })
  approxLongitude!: number;
}

class SavedListingCardDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: 25000 })
  monthlyRent!: number;

  @ApiProperty({ example: 2 })
  bedrooms!: number;

  @ApiProperty({ example: 1 })
  bathrooms!: number;

  @ApiProperty({ example: 'TWO_BEDROOM' })
  houseType!: string;

  @ApiProperty({ example: 'Apartment' })
  propertyType!: string;

  @ApiProperty({ example: false })
  furnished!: boolean;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  availableFrom!: string;

  @ApiProperty({ example: 2500 })
  unlockCostCredits!: number;

  @ApiProperty({ example: 'https://cdn.pataspace.test/photo-1.jpg', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({ example: 45 })
  viewCount!: number;

  @ApiProperty({ example: 3 })
  unlockCount!: number;

  @ApiProperty({ example: false })
  isUnlocked!: boolean;

  @ApiProperty({ example: '2026-03-21T14:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: () => SavedListingCardMapLocationDto })
  mapLocation!: SavedListingCardMapLocationDto;

  @ApiProperty({ type: () => SavedListingCardTenantDto })
  tenant!: SavedListingCardTenantDto;
}

export class SavedListingRecordDto {
  @ApiProperty({ example: 'cm8saved123' })
  id!: string;

  @ApiProperty({ type: () => SavedListingCardDto })
  listing!: SavedListingCardDto;

  @ApiProperty({ example: '2026-04-02T09:00:00.000Z' })
  createdAt!: string;
}

class SavedListingsPaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 1 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

export class PaginatedSavedListingsResponseDto {
  @ApiProperty({ type: () => [SavedListingRecordDto] })
  data!: SavedListingRecordDto[];

  @ApiProperty({ type: () => SavedListingsPaginationDto })
  pagination!: SavedListingsPaginationDto;
}

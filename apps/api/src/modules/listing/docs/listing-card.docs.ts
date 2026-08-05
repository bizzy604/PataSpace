/**
 * Purpose: Swagger models for the public listing card and its detail expansion.
 * Why important: The card is what every browse surface renders, and `status` is
 *   the field that tells a client a house is CONFIRMED (taken) so it must not
 *   advertise an unlock CTA the API answers 410 on. Docs drifting from the
 *   contract is how a client gets built against a field that isn't there.
 * Used by: ListingController, listing.docs.ts (barrel).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingHouseType, PosterRole } from '@pataspace/contracts';
import { ListingStatus } from '@prisma/client';

export class ListingTenantPreviewDto {
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: '2026-01-15T09:30:00.000Z' })
  joinedDate!: string;
}

export class ListingTenantDetailsDto extends ListingTenantPreviewDto {
  @ApiProperty({ example: 2 })
  listingsPosted!: number;
}

export class ListingPhotoDto {
  @ApiProperty({
    example: 'http://localhost:3000/sandbox-storage/listings/user_123/images/photo-1.jpg',
  })
  url!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ example: 1920 })
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  height?: number;
}

export class ListingVideoDto {
  @ApiProperty({
    example: 'http://localhost:3000/sandbox-storage/listings/user_123/videos/walkthrough.mp4',
  })
  url!: string;
}

export class ListingContactInfoDto {
  @ApiProperty({ example: '123 Argwings Kodhek Road, Apt 5B' })
  address!: string;

  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: -1.289563 })
  latitude!: number;

  @ApiProperty({ example: 36.790942 })
  longitude!: number;
}

export class ListingMapLocationDto {
  @ApiProperty({ example: -1.29 })
  approxLatitude!: number;

  @ApiProperty({ example: 36.79 })
  approxLongitude!: number;
}

export class ListingCardDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({
    enum: ListingStatus,
    example: ListingStatus.ACTIVE,
    description:
      'Lifecycle status. CONFIRMED means both sides confirmed the handover: the ' +
      'listing stays browsable but POST /unlocks answers 410 LISTING_UNAVAILABLE.',
  })
  status!: ListingStatus;

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

  @ApiProperty({ enum: ListingHouseType, example: ListingHouseType.TWO_BEDROOM })
  houseType!: ListingHouseType;

  @ApiProperty({ example: 'Apartment' })
  propertyType!: string;

  @ApiProperty({ example: false })
  furnished!: boolean;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  availableFrom!: string;

  @ApiProperty({ example: 300, description: 'Flat unlock band by unit type (credits).' })
  unlockCostCredits!: number;

  @ApiProperty({
    example: 2500,
    description: 'Success fee paid by the mover only at confirmed move-in (KES).',
  })
  successFeeKes!: number;

  @ApiProperty({ example: true })
  landlordAware!: boolean;

  @ApiProperty({ enum: PosterRole, example: PosterRole.OUTGOING_TENANT })
  posterRole!: PosterRole;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/sandbox-storage/listings/user_123/images/photo-1.jpg',
  })
  thumbnailUrl?: string;

  @ApiProperty({ example: 0 })
  viewCount!: number;

  @ApiProperty({ example: 0 })
  unlockCount!: number;

  @ApiProperty({ example: false })
  isUnlocked!: boolean;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: () => ListingMapLocationDto })
  mapLocation!: ListingMapLocationDto;

  @ApiProperty({ type: () => ListingTenantPreviewDto })
  tenant!: ListingTenantPreviewDto;
}

export class ListingDetailsDto extends ListingCardDto {
  @ApiProperty({ example: 'Spacious 2BR with balcony and good natural light.' })
  description!: string;

  @ApiProperty({ type: [String], example: ['Water 24/7', 'Parking'] })
  amenities!: string[];

  @ApiPropertyOptional({ example: 'Landlord is responsive and the block is quiet.' })
  propertyNotes?: string;

  @ApiPropertyOptional({ example: '2026-05-31T00:00:00.000Z' })
  availableTo?: string;

  @ApiProperty({ type: [ListingPhotoDto] })
  photos!: ListingPhotoDto[];

  @ApiPropertyOptional({ type: () => ListingVideoDto })
  video?: ListingVideoDto;

  @ApiProperty({ type: () => ListingTenantDetailsDto })
  declare tenant: ListingTenantDetailsDto;

  @ApiPropertyOptional({ type: () => ListingContactInfoDto })
  contactInfo?: ListingContactInfoDto;
}

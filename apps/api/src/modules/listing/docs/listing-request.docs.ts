/**
 * Purpose: Swagger models for listing write requests (create, update, seed).
 * Why important: Documents the shape a poster must send to /listings, including
 *   the landlord-aware attestation and the mover-to-poster seed handoff.
 * Used by: ListingController, listing.docs.ts (barrel).
 */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ListingHouseType, PosterRole } from '@pataspace/contracts';

export class ListingPhotoInputDto {
  @ApiProperty({
    example: 'http://localhost:3000/sandbox-storage/listings/user_123/images/photo-1.jpg',
  })
  url!: string;

  @ApiProperty({ example: 'listings/user_123/images/photo-1.jpg' })
  s3Key!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ example: 1920 })
  width?: number;

  @ApiPropertyOptional({ example: 1080 })
  height?: number;

  @ApiProperty({ example: -1.289563 })
  latitude!: number;

  @ApiProperty({ example: 36.790942 })
  longitude!: number;

  @ApiPropertyOptional({ example: '2026-03-20T10:30:00.000Z' })
  takenAt?: string;
}

export class ListingVideoInputDto {
  @ApiProperty({
    example: 'http://localhost:3000/sandbox-storage/listings/user_123/videos/walkthrough.mp4',
  })
  url!: string;

  @ApiProperty({ example: 'listings/user_123/videos/walkthrough.mp4' })
  s3Key!: string;
}

export class CreateListingRequestDto {
  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: '123 Argwings Kodhek Road, Apt 5B' })
  address!: string;

  @ApiProperty({ example: -1.289563 })
  latitude!: number;

  @ApiProperty({ example: 36.790942 })
  longitude!: number;

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

  @ApiProperty({ example: 'Spacious 2BR with balcony and good natural light.' })
  description!: string;

  @ApiProperty({ type: [String], example: ['Water 24/7', 'Parking'] })
  amenities!: string[];

  @ApiPropertyOptional({ example: 'Landlord is responsive and the block is quiet.' })
  propertyNotes?: string;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  availableFrom!: string;

  @ApiPropertyOptional({ example: '2026-05-31T00:00:00.000Z' })
  availableTo?: string;

  @ApiProperty({ type: [ListingPhotoInputDto] })
  photos!: ListingPhotoInputDto[];

  @ApiProperty({ type: () => ListingVideoInputDto })
  video!: ListingVideoInputDto;

  @ApiProperty({
    example: true,
    description:
      'Attestation that the landlord/caretaker knows this unit is being listed. Must be true.',
  })
  landlordAware!: boolean;

  @ApiPropertyOptional({ enum: PosterRole, example: PosterRole.OUTGOING_TENANT })
  posterRole?: PosterRole;

  @ApiPropertyOptional({
    example: 'cmf0confirmation123',
    description: 'Move-in confirmation that seeded this listing (mover-to-poster flow).',
  })
  seededFromConfirmationId?: string;
}

export class UpdateListingRequestDto extends PartialType(CreateListingRequestDto) {}

export class SeedListingFromConfirmationRequestDto {
  @ApiProperty({ example: 'cm8confirmation123' })
  confirmationId!: string;
}

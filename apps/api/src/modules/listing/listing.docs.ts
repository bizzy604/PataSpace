import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';

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
}

export class UpdateListingRequestDto extends PartialType(CreateListingRequestDto) {}

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

export class ListingCardDto {
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

  @ApiProperty({ example: 'Apartment' })
  propertyType!: string;

  @ApiProperty({ example: false })
  furnished!: boolean;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  availableFrom!: string;

  @ApiProperty({ example: 2500 })
  unlockCostCredits!: number;

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

export class ListingPaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;

  @ApiProperty({ example: false })
  hasPrev!: boolean;
}

export class BrowseListingsResponseDto {
  @ApiProperty({ type: [ListingCardDto] })
  data!: ListingCardDto[];

  @ApiProperty({ type: () => ListingPaginationDto })
  pagination!: ListingPaginationDto;
}

export class CreateListingResponseDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.PENDING })
  status!: ListingStatus;

  @ApiProperty({ example: 'Listing created. Awaiting admin review (first 3 listings).' })
  message!: string;

  @ApiProperty({ example: 2500 })
  unlockCostCredits!: number;

  @ApiProperty({ example: 750 })
  commission!: number;

  @ApiPropertyOptional({ example: '24 hours' })
  estimatedApprovalTime?: string;
}

export class UpdateListingResponseDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Listing updated successfully' })
  message!: string;

  @ApiProperty({ example: '2026-03-21T14:30:00.000Z' })
  updatedAt!: string;
}

export class MyListingDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiProperty({ example: 25000 })
  monthlyRent!: number;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: 45 })
  viewCount!: number;

  @ApiProperty({ example: 3 })
  unlockCount!: number;

  @ApiProperty({ example: 2250 })
  totalEarnings!: number;

  @ApiProperty({ example: 750 })
  pendingEarnings!: number;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: string;
}

export class MyListingsResponseDto {
  @ApiProperty({ type: [MyListingDto] })
  data!: MyListingDto[];

  @ApiProperty({ type: () => ListingPaginationDto })
  pagination!: ListingPaginationDto;
}

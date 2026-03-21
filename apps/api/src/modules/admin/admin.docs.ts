import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';
import { ListingPhotoDto } from '../listing/listing.docs';

export class AdminPendingListingTenantDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;

  @ApiProperty({ example: 1 })
  listingsPosted!: number;
}

export class AdminPendingListingDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ type: () => AdminPendingListingTenantDto })
  tenant!: AdminPendingListingTenantDto;

  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: 25000 })
  monthlyRent!: number;

  @ApiProperty({ type: [ListingPhotoDto] })
  photos!: ListingPhotoDto[];

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: 1 })
  daysWaiting!: number;
}

export class AdminPendingListingsResponseDto {
  @ApiProperty({ type: [AdminPendingListingDto] })
  data!: AdminPendingListingDto[];
}

export class RejectListingRequestDto {
  @ApiProperty({ example: 'Photos do not match GPS coordinates' })
  reason!: string;
}

export class ModerateListingResponseDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiProperty({ example: 'Listing approved and now visible to all users' })
  message!: string;
}

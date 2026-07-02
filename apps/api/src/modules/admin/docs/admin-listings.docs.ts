/**
 * Purpose: Swagger models for the admin listing CRUD endpoints.
 * Why important: Documents the full-catalogue admin surface (list, edit,
 *   soft delete) separately from tenant-facing listing docs.
 * Used by: AdminListingsController (modules/admin).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingHouseType, ListingStatus } from '@pataspace/contracts';
import { AdminPaginationMetaDto } from './admin-users.docs';

export class AdminListingOwnerDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;
}

export class AdminListingSummaryDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ type: () => AdminListingOwnerDto })
  owner!: AdminListingOwnerDto;

  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;

  @ApiProperty({ example: 25000 })
  monthlyRent!: number;

  @ApiProperty({ enum: ListingHouseType, example: ListingHouseType.ONE_BEDROOM })
  houseType!: ListingHouseType;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiProperty({ example: true })
  isApproved!: boolean;

  @ApiProperty({ example: false })
  isDeleted!: boolean;

  @ApiProperty({ example: 120 })
  viewCount!: number;

  @ApiProperty({ example: 4 })
  unlockCount!: number;

  @ApiProperty({ example: 50 })
  unlockCostCredits!: number;

  @ApiProperty({ example: 750 })
  commission!: number;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  updatedAt!: string;
}

export class AdminListingsResponseDto {
  @ApiProperty({ type: [AdminListingSummaryDto] })
  data!: AdminListingSummaryDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

export class AdminUpdateListingRequestDto {
  @ApiPropertyOptional({ example: 28000 })
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 'Kileleshwa' })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Spacious one bedroom with balcony.' })
  description?: string;

  @ApiPropertyOptional({ enum: ListingHouseType })
  houseType?: ListingHouseType;

  @ApiPropertyOptional({ example: 60 })
  unlockCostCredits?: number;

  @ApiPropertyOptional({ example: 800 })
  commission?: number;
}

export class AdminDeleteListingRequestDto {
  @ApiPropertyOptional({ example: 'Listing confirmed fraudulent by support case #812' })
  reason?: string;
}

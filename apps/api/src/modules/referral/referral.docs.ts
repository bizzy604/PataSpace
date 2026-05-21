/**
 * Purpose: Swagger DTOs for the referral module HTTP surface.
 * Why important: Backs /docs documentation for referral submission and listing.
 * Used by: ReferralController.
 */
import { ApiProperty } from '@nestjs/swagger';
import { ReferralStatus } from '@prisma/client';

export class CreateReferralRequestDto {
  @ApiProperty({ example: '+254712345678' })
  phoneNumber!: string;
}

export class ReferralRecordDto {
  @ApiProperty({ example: 'cm8referral123' })
  id!: string;

  @ApiProperty({ example: 'A1B2C3D4' })
  code!: string;

  @ApiProperty({ example: '+254***678' })
  inviteePhoneMasked!: string;

  @ApiProperty({ enum: ReferralStatus, example: ReferralStatus.INVITED })
  status!: ReferralStatus;

  @ApiProperty({ example: null, nullable: true })
  joinedAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  rewardedAt!: string | null;

  @ApiProperty({ example: '2026-04-02T09:00:00.000Z' })
  createdAt!: string;
}

export class ReferralPaginationDto {
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

export class PaginatedReferralsResponseDto {
  @ApiProperty({ type: () => [ReferralRecordDto] })
  data!: ReferralRecordDto[];

  @ApiProperty({ type: () => ReferralPaginationDto })
  pagination!: ReferralPaginationDto;
}

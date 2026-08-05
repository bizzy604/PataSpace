/**
 * Purpose: Swagger models for listing responses — pagination envelopes, write
 *   acknowledgements, and the poster-facing My Listings rows.
 * Why important: These are the owner's view of the money (commissions, pending
 *   earnings) and the status a poster sees after a handover locks the listing.
 * Used by: ListingController, listing.docs.ts (barrel).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PosterRole } from '@pataspace/contracts';
import { CommissionStatus, ListingStatus } from '@prisma/client';
import { ListingCardDto } from './listing-card.docs';

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

  @ApiProperty({ example: 300, description: 'Flat unlock band by unit type (credits).' })
  unlockCostCredits!: number;

  @ApiProperty({
    example: 1750,
    description: 'Poster share (70%) of the success fee if the move-in confirms (KES).',
  })
  commission!: number;

  @ApiProperty({
    example: 2500,
    description: 'Success fee due from the mover at confirmed move-in (KES).',
  })
  successFeeKes!: number;

  @ApiPropertyOptional({ example: '24 hours' })
  estimatedApprovalTime?: string;
}

export class SeedListingFromConfirmationResponseDto {
  @ApiProperty({ example: 'cm8confirmation123' })
  seededFromConfirmationId!: string;

  @ApiProperty({ enum: PosterRole, example: PosterRole.OUTGOING_TENANT })
  posterRole!: PosterRole;

  @ApiProperty({ example: 1750 })
  estimatedEarningsKes!: number;

  @ApiProperty({
    example: 25000,
    description: 'Rent used for the estimate (new home rent as proxy).',
  })
  estimateBasisRentKes!: number;

  @ApiProperty({
    example: "Leaving a house behind? It's worth ~KES 1750 on PataSpace. Post it in 2 minutes.",
  })
  message!: string;
}

export class UpdateListingResponseDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Listing updated successfully' })
  message!: string;

  @ApiProperty({ example: '2026-03-21T14:30:00.000Z' })
  updatedAt!: string;
}

export class MyListingCommissionSummaryDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ example: 750 })
  amountKES!: number;

  @ApiProperty({ enum: CommissionStatus, example: CommissionStatus.PENDING })
  status!: CommissionStatus;

  @ApiProperty({ example: '2026-04-05T09:00:00.000Z', nullable: true })
  eligibleAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  paidAt!: string | null;
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

  @ApiProperty({ type: () => [MyListingCommissionSummaryDto] })
  commissions!: MyListingCommissionSummaryDto[];
}

export class MyListingsResponseDto {
  @ApiProperty({ type: [MyListingDto] })
  data!: MyListingDto[];

  @ApiProperty({ type: () => ListingPaginationDto })
  pagination!: ListingPaginationDto;
}

/**
 * Purpose: Swagger DTOs for the review module HTTP surface.
 * Why important: Drives /docs documentation for review submissions.
 * Used by: ReviewController.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewerSide } from '@prisma/client';

export class CreateReviewRequestDto {
  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating!: number;

  @ApiPropertyOptional({ example: 'The handover was smooth and the unit matched the listing.' })
  comment?: string;
}

export class ReviewRecordDto {
  @ApiProperty({ example: 'cm8review123' })
  id!: string;

  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ enum: ReviewerSide, example: ReviewerSide.INCOMING_TENANT })
  side!: ReviewerSide;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiProperty({ example: 'The unit matched the listing.', nullable: true })
  comment!: string | null;

  @ApiProperty({ example: '2026-04-02T09:00:00.000Z' })
  createdAt!: string;
}

/**
 * Purpose: Swagger DTOs for the support module HTTP surface.
 * Why important: Drives /docs documentation; keeps the published API contract
 *   in sync with @pataspace/contracts types used elsewhere.
 * Used by: SupportController.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketStatus } from '@prisma/client';

export class CreateSupportTicketRequestDto {
  @ApiProperty({ example: 'Pending M-Pesa prompt follow-up' })
  subject!: string;

  @ApiProperty({
    example: 'STK push arrived late and the transaction stayed pending for fifteen minutes.',
  })
  message!: string;

  @ApiPropertyOptional({ example: 'cm8unlock123' })
  relatedUnlockId?: string;
}

export class SupportTicketRecordDto {
  @ApiProperty({ example: 'cm8support123' })
  id!: string;

  @ApiProperty({ example: 'Pending M-Pesa prompt follow-up' })
  subject!: string;

  @ApiProperty({ example: 'STK push arrived late...' })
  message!: string;

  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.OPEN })
  status!: SupportTicketStatus;

  @ApiProperty({ example: null, nullable: true })
  relatedUnlockId!: string | null;

  @ApiProperty({ example: null, nullable: true })
  channel!: string | null;

  @ApiProperty({ example: null, nullable: true })
  adminNotes!: string | null;

  @ApiProperty({ example: null, nullable: true })
  resolvedAt!: string | null;

  @ApiProperty({ example: '2026-03-29T08:10:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-29T08:10:00.000Z' })
  updatedAt!: string;
}

export class SupportTicketsPaginationDto {
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

export class PaginatedSupportTicketsResponseDto {
  @ApiProperty({ type: () => [SupportTicketRecordDto] })
  data!: SupportTicketRecordDto[];

  @ApiProperty({ type: () => SupportTicketsPaginationDto })
  pagination!: SupportTicketsPaginationDto;
}

/**
 * Purpose: Swagger models for the admin dispute queue endpoint.
 * Why important: Documents the queue payload the console's dispute workflow
 *   renders.
 * Used by: AdminDisputesController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import { DisputeStatus } from '@pataspace/contracts';
import { AdminPaginationMetaDto } from './admin-users.docs';

export class AdminDisputeReporterDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;
}

export class AdminDisputeListingDto {
  @ApiProperty({ example: 'cm8listing123' })
  id!: string;

  @ApiProperty({ example: 'Nairobi' })
  county!: string;

  @ApiProperty({ example: 'Kilimani' })
  neighborhood!: string;
}

export class AdminDisputeSummaryDto {
  @ApiProperty({ example: 'cm8dispute123' })
  id!: string;

  @ApiProperty({ example: 'cm8unlock123' })
  unlockId!: string;

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.OPEN })
  status!: DisputeStatus;

  @ApiProperty({ example: 'The listing photos did not match the property.' })
  reason!: string;

  @ApiProperty({ example: 2 })
  evidenceCount!: number;

  @ApiProperty({ type: () => AdminDisputeReporterDto })
  reportedBy!: AdminDisputeReporterDto;

  @ApiProperty({ type: () => AdminDisputeListingDto })
  listing!: AdminDisputeListingDto;

  @ApiProperty({ example: null, nullable: true })
  resolution!: string | null;

  @ApiProperty({ example: null, nullable: true })
  resolvedAt!: string | null;

  @ApiProperty({ example: '2026-06-28T10:00:00.000Z' })
  createdAt!: string;
}

export class AdminDisputesResponseDto {
  @ApiProperty({ type: [AdminDisputeSummaryDto] })
  data!: AdminDisputeSummaryDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

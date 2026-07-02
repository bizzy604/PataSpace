/**
 * Purpose: Swagger models for the admin dashboard metrics endpoint.
 * Why important: Documents the aggregation payload the console dashboard
 *   renders, tile by tile.
 * Used by: AdminMetricsController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';

export class AdminUserMetricsDto {
  @ApiProperty({ example: 1250 })
  total!: number;

  @ApiProperty({ example: 12 })
  banned!: number;

  @ApiProperty({ example: 85 })
  newLast7Days!: number;
}

export class AdminListingMetricsDto {
  @ApiProperty({ example: 430 })
  total!: number;

  @ApiProperty({ example: 12 })
  pending!: number;

  @ApiProperty({ example: 310 })
  active!: number;

  @ApiProperty({ example: 25 })
  rejected!: number;
}

export class AdminUnlockMetricsDto {
  @ApiProperty({ example: 890 })
  total!: number;

  @ApiProperty({ example: 43 })
  last7Days!: number;
}

export class AdminDisputeMetricsDto {
  @ApiProperty({ example: 4 })
  open!: number;

  @ApiProperty({ example: 2 })
  investigating!: number;
}

export class AdminCommissionMetricsDto {
  @ApiProperty({ example: 9 })
  pendingCount!: number;

  @ApiProperty({ example: 6750 })
  pendingAmountKES!: number;

  @ApiProperty({ example: 120 })
  paidCount!: number;

  @ApiProperty({ example: 90000 })
  paidAmountKES!: number;
}

export class AdminSupportMetricsDto {
  @ApiProperty({ example: 3 })
  open!: number;
}

export class AdminMetricsResponseDto {
  @ApiProperty({ type: () => AdminUserMetricsDto })
  users!: AdminUserMetricsDto;

  @ApiProperty({ type: () => AdminListingMetricsDto })
  listings!: AdminListingMetricsDto;

  @ApiProperty({ type: () => AdminUnlockMetricsDto })
  unlocks!: AdminUnlockMetricsDto;

  @ApiProperty({ type: () => AdminDisputeMetricsDto })
  disputes!: AdminDisputeMetricsDto;

  @ApiProperty({ type: () => AdminCommissionMetricsDto })
  commissions!: AdminCommissionMetricsDto;

  @ApiProperty({ type: () => AdminSupportMetricsDto })
  supportTickets!: AdminSupportMetricsDto;

  @ApiProperty({ example: '2026-07-02T10:00:00.000Z' })
  generatedAt!: string;
}

/**
 * Purpose: Swagger models for the admin system-config endpoints.
 * Why important: Documents the effective-config entry shape the console edits.
 * Used by: AdminConfigController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';

export class AdminConfigEntryDto {
  @ApiProperty({ example: 'pricing.successFeePct' })
  key!: string;

  @ApiProperty({ enum: ['PRICING', 'INCENTIVES'], example: 'PRICING' })
  group!: 'PRICING' | 'INCENTIVES';

  @ApiProperty({ example: 'Success fee' })
  label!: string;

  @ApiProperty({ example: 'Fraction of monthly rent charged as the move-in success fee.' })
  description!: string;

  @ApiProperty({ example: 'ratio (0–1)' })
  unit!: string;

  @ApiProperty({ enum: ['int', 'ratio'], example: 'ratio' })
  kind!: 'int' | 'ratio';

  @ApiProperty({ example: 0.1 })
  value!: number;

  @ApiProperty({ enum: ['default', 'override'], example: 'default' })
  source!: 'default' | 'override';

  @ApiProperty({ example: 0 })
  min!: number;

  @ApiProperty({ example: 1 })
  max!: number;

  @ApiProperty({ example: null, nullable: true })
  updatedAt!: string | null;
}

export class AdminConfigResponseDto {
  @ApiProperty({ type: [AdminConfigEntryDto] })
  data!: AdminConfigEntryDto[];
}

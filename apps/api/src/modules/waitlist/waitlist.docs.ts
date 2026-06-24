/**
 * Purpose: Swagger DTOs for the waitlist module HTTP surface.
 * Why important: Drives /docs documentation for the public waitlist endpoints.
 * Used by: WaitlistController.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinWaitlistRequestDto {
  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Jane Mwangi' })
  name?: string;

  @ApiPropertyOptional({ example: 'landing_page' })
  source?: string;
}

export class WaitlistEntryResponseDto {
  @ApiProperty({ example: 'cm8wl123' })
  id!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ example: 'Jane Mwangi', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 42 })
  position!: number;

  @ApiProperty({ example: '2026-06-24T10:00:00.000Z' })
  createdAt!: string;
}

export class WaitlistCountResponseDto {
  @ApiProperty({ example: 128 })
  count!: number;
}

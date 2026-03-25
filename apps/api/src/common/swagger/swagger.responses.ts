import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'pataspace-api' })
  service!: string;

  @ApiProperty({ example: '2026-03-21T12:00:00.000Z' })
  timestamp!: string;
}

export class ReadinessResponseDto {
  @ApiProperty({ enum: ['ready', 'degraded'], example: 'ready' })
  status!: 'ready' | 'degraded';

  @ApiProperty({ example: 'pataspace-api' })
  service!: string;

  @ApiProperty({ example: '2026-03-21T12:00:00.000Z' })
  timestamp!: string;
}

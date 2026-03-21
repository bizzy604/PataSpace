import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DatabaseHealthResponseDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status!: 'up' | 'down';

  @ApiPropertyOptional({ example: 'Database connectivity check failed' })
  message?: string;
}

export class DependencyHealthResponseDto {
  @ApiProperty({ enum: ['up', 'degraded', 'down'], example: 'up' })
  status!: 'up' | 'degraded' | 'down';

  @ApiProperty({ example: 'redis' })
  provider!: string;

  @ApiPropertyOptional({ example: 'Dependency health degraded but still serving requests.' })
  message?: string;
}

export class ReadinessComponentsResponseDto {
  @ApiProperty({ type: () => DatabaseHealthResponseDto })
  database!: DatabaseHealthResponseDto;

  @ApiProperty({ type: () => DependencyHealthResponseDto })
  cache!: DependencyHealthResponseDto;

  @ApiProperty({ type: () => DependencyHealthResponseDto })
  queue!: DependencyHealthResponseDto;

  @ApiProperty({ type: () => DependencyHealthResponseDto })
  sms!: DependencyHealthResponseDto;

  @ApiProperty({ type: () => DependencyHealthResponseDto })
  storage!: DependencyHealthResponseDto;

  @ApiProperty({ type: () => DependencyHealthResponseDto })
  mpesa!: DependencyHealthResponseDto;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'pataspace-api' })
  service!: string;

  @ApiProperty({ example: 'development' })
  environment!: string;

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

  @ApiProperty({ type: () => ReadinessComponentsResponseDto })
  components!: ReadinessComponentsResponseDto;
}

/**
 * Purpose: Swagger models for the admin audit-log list endpoint.
 * Why important: Documents the before → after payload shape the security
 *   console renders as a diff.
 * Used by: AdminAuditController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import { AdminPaginationMetaDto } from './admin-users.docs';

class AdminAuditActorDto {
  @ApiProperty({ example: 'cm8admin123' })
  id!: string;

  @ApiProperty({ example: 'Ada' })
  firstName!: string;

  @ApiProperty({ example: 'Njeri' })
  lastName!: string;
}

export class AdminAuditLogRecordDto {
  @ApiProperty({ example: 'cm8audit123' })
  id!: string;

  @ApiProperty({ example: 'user.ban' })
  action!: string;

  @ApiProperty({ example: 'User' })
  entityType!: string;

  @ApiProperty({ example: 'cm8user123' })
  entityId!: string;

  @ApiProperty({ type: () => AdminAuditActorDto, nullable: true })
  admin!: AdminAuditActorDto | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { status: 'active' },
  })
  oldValue!: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: { status: 'banned' },
  })
  newValue!: unknown;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true, example: null })
  metadata!: unknown;

  @ApiProperty({ example: '196.201.214.10', nullable: true })
  ipAddress!: string | null;

  @ApiProperty({ example: '2026-07-14T09:45:00.000Z' })
  createdAt!: string;
}

export class AdminAuditLogsResponseDto {
  @ApiProperty({ type: [AdminAuditLogRecordDto] })
  data!: AdminAuditLogRecordDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

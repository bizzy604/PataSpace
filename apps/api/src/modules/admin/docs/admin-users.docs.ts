/**
 * Purpose: Swagger models for the admin user-management endpoints.
 * Why important: Keeps the OpenAPI document accurate for the admin console's
 *   generated clients and for operators exploring the API.
 * Used by: AdminUsersController (modules/admin).
 */
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@pataspace/contracts';

export class AdminPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 134 })
  total!: number;

  @ApiProperty({ example: 7 })
  totalPages!: number;
}

export class AdminUserSummaryDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Mwangi' })
  lastName!: string;

  @ApiProperty({ example: 'john@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: '+254712345678', nullable: true })
  phoneNumber!: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({ example: true })
  phoneVerified!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false })
  isBanned!: boolean;

  @ApiProperty({ example: 2 })
  listingsCount!: number;

  @ApiProperty({ example: 3 })
  unlocksCount!: number;

  @ApiProperty({ example: '2026-03-20T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-30T08:00:00.000Z', nullable: true })
  lastLoginAt!: string | null;
}

export class AdminUsersResponseDto {
  @ApiProperty({ type: [AdminUserSummaryDto] })
  data!: AdminUserSummaryDto[];

  @ApiProperty({ type: () => AdminPaginationMetaDto })
  meta!: AdminPaginationMetaDto;
}

export class AdminUserDetailDto extends AdminUserSummaryDto {
  @ApiProperty({ example: null, nullable: true })
  banReason!: string | null;

  @ApiProperty({ example: 150 })
  creditBalance!: number;

  @ApiProperty({ example: 0 })
  disputesCount!: number;

  @ApiProperty({ example: 1 })
  supportTicketsCount!: number;
}

export class BanUserRequestDto {
  @ApiProperty({ example: 'Repeated fraudulent listings' })
  reason!: string;
}

export class AdminUserActionResponseDto {
  @ApiProperty({ example: 'cm8user123' })
  id!: string;

  @ApiProperty({ example: true })
  isBanned!: boolean;

  @ApiProperty({ example: 'User banned and sessions revoked' })
  message!: string;
}

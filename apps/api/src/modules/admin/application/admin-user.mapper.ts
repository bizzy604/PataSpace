/**
 * Purpose: Pure mapping and filter-building helpers for admin user queries —
 *   Prisma where-clause construction and row-to-contract mapping.
 * Why important: Keeps AdminUserService focused on orchestration and makes the
 *   filter logic unit-testable without a database.
 * Used by: AdminUserService (modules/admin/application).
 */
import { Prisma, Role } from '@prisma/client';
import { AdminUserSummary, Role as ContractRole } from '@pataspace/contracts';
import { UserService } from '../../user/user.service';

export type AdminUsersQuery = {
  page: number;
  limit: number;
  search?: string;
  role?: ContractRole;
  banned?: 'true' | 'false';
};

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumberEncrypted: string | null;
  role: Role;
  phoneVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: { listings: number; unlocks: number };
};

export function buildUsersWhere(query: AdminUsersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.role) {
    where.role = query.role as unknown as Role;
  }

  if (query.banned) {
    where.isBanned = query.banned === 'true';
  }

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function toUserSummary(user: AdminUserRow, userService: UserService): AdminUserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumberEncrypted
      ? userService.decryptPhoneNumber(user.phoneNumberEncrypted)
      : null,
    role: user.role as unknown as ContractRole,
    phoneVerified: user.phoneVerified,
    isActive: user.isActive,
    isBanned: user.isBanned,
    listingsCount: user._count.listings,
    unlocksCount: user._count.unlocks,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

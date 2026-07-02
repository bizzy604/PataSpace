/**
 * Purpose: Transport types for the admin user-management endpoints
 *   (GET /admin/users, GET /admin/users/:id, POST /admin/users/:id/ban|unban).
 * Why important: Shared contract between the admin console in apps/web and the
 *   API's admin module; both sides import these instead of redefining shapes.
 * Used by: apps/api modules/admin, apps/web /admin section.
 */
import { Role } from '../enums';
import { PaginationMeta } from './common';

export type AdminUserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  role: Role;
  phoneVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  listingsCount: number;
  unlocksCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminUsersResponse = {
  data: AdminUserSummary[];
  meta: PaginationMeta;
};

export type AdminUserDetail = AdminUserSummary & {
  banReason: string | null;
  creditBalance: number;
  disputesCount: number;
  supportTicketsCount: number;
};

export type BanUserRequest = {
  reason: string;
};

export type AdminUserActionResponse = {
  id: string;
  isBanned: boolean;
  message: string;
};

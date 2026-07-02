/**
 * Purpose: Zod schemas for the admin user-management endpoints — query
 *   filters, the ban request body, and response validation.
 * Why important: The API validates admin input with these; a malformed filter
 *   or empty ban reason is rejected before it reaches the service layer.
 * Used by: apps/api modules/admin controllers, apps/web /admin section.
 */
import { z } from 'zod';
import { Role } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  banned: z.enum(['true', 'false']).optional(),
});

export const banUserSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const adminUserSummarySchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  role: z.nativeEnum(Role),
  phoneVerified: z.boolean(),
  isActive: z.boolean(),
  isBanned: z.boolean(),
  listingsCount: z.number().int().nonnegative(),
  unlocksCount: z.number().int().nonnegative(),
  createdAt: isoDateStringSchema,
  lastLoginAt: isoDateStringSchema.nullable(),
});

export const adminUsersResponseSchema = z.object({
  data: z.array(adminUserSummarySchema),
  meta: paginationMetaSchema,
});

export const adminUserDetailSchema = adminUserSummarySchema.extend({
  banReason: z.string().nullable(),
  creditBalance: z.number().int().nonnegative(),
  disputesCount: z.number().int().nonnegative(),
  supportTicketsCount: z.number().int().nonnegative(),
});

export const adminUserActionResponseSchema = z.object({
  id: z.string().min(1),
  isBanned: z.boolean(),
  message: z.string().min(1),
});

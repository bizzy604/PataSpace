/**
 * Purpose: Zod schemas for the admin listing CRUD endpoints — catalogue query
 *   filters, the edit payload, and the soft-delete body.
 * Why important: Admin edits write directly to live marketplace data; these
 *   schemas bound every field (rents positive, dates ISO, at least one field
 *   per PATCH) before the service layer runs.
 * Used by: apps/api modules/admin controllers, apps/web /admin section.
 */
import { z } from 'zod';
import { ListingHouseType, ListingStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const adminListingsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(ListingStatus).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  includeDeleted: z.enum(['true', 'false']).optional(),
});

export const adminUpdateListingSchema = z
  .object({
    county: z.string().trim().min(2).max(60),
    neighborhood: z.string().trim().min(2).max(80),
    monthlyRent: z.number().int().positive(),
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(20),
    houseType: z.nativeEnum(ListingHouseType),
    propertyType: z.string().trim().min(2).max(60),
    furnished: z.boolean(),
    description: z.string().trim().min(10).max(5000),
    amenities: z.array(z.string().trim().min(1).max(60)).max(30),
    propertyNotes: z.string().trim().max(2000).nullable(),
    unlockCostCredits: z.number().int().positive(),
    commission: z.number().int().nonnegative(),
    availableFrom: isoDateStringSchema,
    availableTo: isoDateStringSchema.nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const adminDeleteListingSchema = z.object({
  reason: z.string().trim().min(5).max(500).optional(),
});

export const adminListingSummarySchema = z.object({
  id: z.string().min(1),
  owner: z.object({
    id: z.string().min(1),
    firstName: z.string(),
    lastName: z.string(),
  }),
  county: z.string(),
  neighborhood: z.string(),
  monthlyRent: z.number().int().positive(),
  houseType: z.nativeEnum(ListingHouseType),
  status: z.nativeEnum(ListingStatus),
  isApproved: z.boolean(),
  isDeleted: z.boolean(),
  viewCount: z.number().int().nonnegative(),
  unlockCount: z.number().int().nonnegative(),
  unlockCostCredits: z.number().int().positive(),
  commission: z.number().int().nonnegative(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const adminListingsResponseSchema = z.object({
  data: z.array(adminListingSummarySchema),
  meta: paginationMetaSchema,
});

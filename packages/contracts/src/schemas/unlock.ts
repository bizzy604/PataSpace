import { z } from 'zod';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const unlockContactSchema = z.object({
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createUnlockSchema = z.object({
  listingId: z.string().min(1),
});

export const unlockTenantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
});

export const createUnlockResponseSchema = z.object({
  unlockId: z.string().min(1),
  creditsSpent: z.number().int().nonnegative(),
  newBalance: z.number().int().nonnegative(),
  contactInfo: unlockContactSchema,
  tenant: unlockTenantSchema,
  message: z.string().min(1),
});

export const unlockHistoryStatusSchema = z.enum([
  'pending_confirmation',
  'confirmed',
  'disputed',
  'refunded',
]);

export const myUnlocksQuerySchema = paginationQuerySchema.extend({
  status: unlockHistoryStatusSchema.optional(),
});

export const myUnlockListingSchema = z.object({
  id: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
});

export const myUnlockRecordSchema = z.object({
  unlockId: z.string().min(1),
  listing: myUnlockListingSchema,
  creditsSpent: z.number().int().nonnegative(),
  contactInfo: unlockContactSchema,
  status: unlockHistoryStatusSchema,
  myConfirmation: isoDateStringSchema.nullable(),
  tenantConfirmation: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
});

export const paginatedMyUnlocksResponseSchema = z.object({
  data: z.array(myUnlockRecordSchema),
  pagination: paginationMetaSchema.extend({
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

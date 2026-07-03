import { z } from 'zod';
import { CommissionStatus, DisputeStatus, UnlockDeadReason } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

// 'masked' means phoneNumber carries a pooled virtual number bridged by the
// platform (spec section 4.5); 'direct' is the legacy raw-number reveal used
// until a voice provider is configured.
export const unlockContactModeSchema = z.enum(['direct', 'masked']);

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
  contactMode: unlockContactModeSchema,
  contactExpiresAt: isoDateStringSchema.nullable(),
  tenant: unlockTenantSchema,
  message: z.string().min(1),
});

export const reportUnlockDeadSchema = z.object({
  reason: z.nativeEnum(UnlockDeadReason),
  comment: z.string().max(500).optional(),
});

export const reportUnlockDeadResponseSchema = z.object({
  unlockId: z.string().min(1),
  reason: z.nativeEnum(UnlockDeadReason),
  creditsRefunded: z.number().int().nonnegative(),
  newBalance: z.number().int().nonnegative(),
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

export const myUnlockDisputeSummarySchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(DisputeStatus),
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
  dispute: myUnlockDisputeSummarySchema.nullable(),
});

export const paginatedMyUnlocksResponseSchema = z.object({
  data: z.array(myUnlockRecordSchema),
  pagination: paginationMetaSchema.extend({
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const receivedUnlockStatusSchema = z.enum([
  'awaiting_confirmation',
  'confirmed',
  'all',
]);

export const receivedUnlocksQuerySchema = paginationQuerySchema.extend({
  status: receivedUnlockStatusSchema.optional(),
});

export const receivedUnlockCommissionSchema = z.object({
  amountKES: z.number().int().nonnegative(),
  status: z.nativeEnum(CommissionStatus),
  payableOn: isoDateStringSchema.nullable(),
});

export const receivedUnlockRecordSchema = z.object({
  unlockId: z.string().min(1),
  listing: myUnlockListingSchema,
  incomingConfirmed: z.boolean(),
  outgoingConfirmed: z.boolean(),
  status: unlockHistoryStatusSchema,
  commission: receivedUnlockCommissionSchema.nullable(),
  isRefunded: z.boolean(),
  createdAt: isoDateStringSchema,
});

export const paginatedReceivedUnlocksResponseSchema = z.object({
  data: z.array(receivedUnlockRecordSchema),
  pagination: paginationMetaSchema.extend({
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

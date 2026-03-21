import { z } from 'zod';
import { isoDateStringSchema } from './common';

export const unlockContactSchema = z.object({
  phoneNumber: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createUnlockSchema = z.object({
  listingId: z.string().min(1),
});

export const unlockRecordSchema = z.object({
  unlockId: z.string().min(1),
  listingId: z.string().min(1),
  creditsSpent: z.number().int().nonnegative(),
  createdAt: isoDateStringSchema,
  contact: unlockContactSchema,
  message: z.string().optional(),
});

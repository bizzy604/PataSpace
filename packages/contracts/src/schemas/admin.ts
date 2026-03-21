import { z } from 'zod';
import { ListingStatus } from '../enums';
import { isoDateStringSchema } from './common';
import { listingPhotoSchema } from './listing';

export const rejectListingSchema = z.object({
  reason: z.string().min(5),
});

export const adminListingTenantSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  phoneNumber: z.string().regex(/^\+254\d{9}$/),
  listingsPosted: z.number().int().nonnegative(),
});

export const adminPendingListingSchema = z.object({
  id: z.string().min(1),
  tenant: adminListingTenantSchema,
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  photos: z.array(listingPhotoSchema),
  createdAt: isoDateStringSchema,
  daysWaiting: z.number().int().nonnegative(),
});

export const adminPendingListingsResponseSchema = z.object({
  data: z.array(adminPendingListingSchema),
});

export const moderateListingSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(ListingStatus),
  message: z.string().min(1),
});

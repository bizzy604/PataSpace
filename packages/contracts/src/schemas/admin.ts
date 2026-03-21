import { z } from 'zod';
import { ListingStatus } from '../enums';
import { isoDateStringSchema } from './common';

export const moderateListingSchema = z.object({
  listingId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().min(5).optional(),
});

export const adminListingReviewSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  status: z.nativeEnum(ListingStatus),
  createdAt: isoDateStringSchema,
});

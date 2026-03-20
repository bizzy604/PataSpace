import { z } from 'zod';

export const listingPhotoSchema = z.object({
  url: z.string().url(),
  s3Key: z.string().min(1),
  order: z.number().int().positive(),
});

export const createListingSchema = z.object({
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  photos: z.array(listingPhotoSchema).min(5).max(15),
});

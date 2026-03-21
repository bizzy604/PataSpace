import { z } from 'zod';
import { ListingStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema } from './common';

export const listingPhotoSchema = z.object({
  url: z.string().url(),
  s3Key: z.string().min(1),
  order: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  takenAt: isoDateStringSchema.optional(),
});

export const createListingSchema = z.object({
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  address: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
  monthlyRent: z.number().int().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  propertyType: z.string().min(2),
  furnished: z.boolean().default(false),
  description: z.string().min(20),
  amenities: z.array(z.string().min(1)).min(1),
  propertyNotes: z.string().optional(),
  availableFrom: isoDateStringSchema,
  availableTo: isoDateStringSchema.optional(),
  videoUrl: z.string().url().optional(),
  photos: z.array(listingPhotoSchema).min(5).max(15),
});

export const updateListingSchema = createListingSchema.partial();

export const listingCardSchema = z.object({
  id: z.string().min(1),
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  unlockCostCredits: z.number().int().positive(),
  thumbnailUrl: z.string().url().optional(),
  status: z.nativeEnum(ListingStatus),
});

export const listingDetailsSchema = listingCardSchema.extend({
  description: z.string().min(1),
  amenities: z.array(z.string().min(1)),
  propertyType: z.string().min(1),
  furnished: z.boolean(),
  availableFrom: isoDateStringSchema,
  availableTo: isoDateStringSchema.optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photos: z.array(listingPhotoSchema).default([]),
});

export const listingFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  county: z.string().optional(),
  neighborhood: z.string().optional(),
  minRent: z.coerce.number().int().positive().optional(),
  maxRent: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
});

export const paginatedListingsResponseSchema = z.object({
  data: z.array(listingCardSchema),
  meta: paginationMetaSchema,
});

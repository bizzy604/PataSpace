import { z } from 'zod';
import { ListingHouseType, ListingStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema } from './common';

const coordinateSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});

const listingPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

const listingDateRangeRefinement = (
  value: { availableFrom?: string; availableTo?: string },
  context: z.RefinementCtx,
) => {
  if (!value.availableFrom || !value.availableTo) {
    return;
  }

  const availableFrom = new Date(value.availableFrom);
  const availableTo = new Date(value.availableTo);

  if (availableTo.getTime() < availableFrom.getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['availableTo'],
      message: 'availableTo must be on or after availableFrom',
    });
  }
};

const uniquePhotoOrderRefinement = (
  photos: Array<{ order: number }>,
  context: z.RefinementCtx,
) => {
  const seenOrders = new Set<number>();

  photos.forEach((photo, index) => {
    if (!seenOrders.has(photo.order)) {
      seenOrders.add(photo.order);
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [index, 'order'],
      message: 'Photo order values must be unique',
    });
  });
};

export const listingPhotoInputSchema = z
  .object({
    url: z.string().url(),
    s3Key: z.string().min(1),
    order: z.number().int().positive(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
    takenAt: isoDateStringSchema.optional(),
  })
  .merge(coordinateSchema);

export const listingVideoInputSchema = z.object({
  url: z.string().url(),
  s3Key: z.string().min(1),
});

const createListingShape = z.object({
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  address: z.string().min(5),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  monthlyRent: z.number().int().min(2000).max(500000),
  bedrooms: z.number().int().min(0).max(10),
  bathrooms: z.number().int().min(0).max(10),
  houseType: z.nativeEnum(ListingHouseType),
  propertyType: z.string().min(2),
  furnished: z.boolean().default(false),
  description: z.string().min(20),
  amenities: z.array(z.string().min(1)).min(1).max(30),
  propertyNotes: z.string().optional(),
  availableFrom: isoDateStringSchema,
  availableTo: isoDateStringSchema.optional(),
  photos: z.array(listingPhotoInputSchema).min(5).max(15),
  video: listingVideoInputSchema,
});

export const createListingSchema = createListingShape.superRefine(
  (value: z.infer<typeof createListingShape>, context: z.RefinementCtx) => {
    listingDateRangeRefinement(value, context);
    uniquePhotoOrderRefinement(value.photos, context);
  },
);

export const updateListingSchema = createListingShape
  .partial()
  .superRefine((value: Partial<z.infer<typeof createListingShape>>, context: z.RefinementCtx) => {
    listingDateRangeRefinement(value, context);

    if (value.photos) {
      uniquePhotoOrderRefinement(value.photos, context);
    }
  });

export const listingPhotoSchema = z.object({
  url: z.string().url(),
  order: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const listingVideoSchema = z.object({
  url: z.string().url(),
});

export const listingContactInfoSchema = z
  .object({
    address: z.string().min(5),
    phoneNumber: z.string().regex(/^\+254\d{9}$/),
  })
  .merge(coordinateSchema);

export const listingMapLocationSchema = z.object({
  approxLatitude: z.number().gte(-90).lte(90),
  approxLongitude: z.number().gte(-180).lte(180),
});

export const listingTenantPreviewSchema = z.object({
  firstName: z.string().min(1),
  joinedDate: isoDateStringSchema,
});

export const listingTenantDetailsSchema = listingTenantPreviewSchema.extend({
  listingsPosted: z.number().int().nonnegative(),
});

export const listingCardSchema = z.object({
  id: z.string().min(1),
  county: z.string().min(1),
  neighborhood: z.string().min(1),
  monthlyRent: z.number().int().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  houseType: z.nativeEnum(ListingHouseType),
  propertyType: z.string().min(1),
  furnished: z.boolean(),
  availableFrom: isoDateStringSchema,
  unlockCostCredits: z.number().int().positive(),
  thumbnailUrl: z.string().url().optional(),
  viewCount: z.number().int().nonnegative(),
  unlockCount: z.number().int().nonnegative(),
  isUnlocked: z.boolean(),
  createdAt: isoDateStringSchema,
  mapLocation: listingMapLocationSchema,
  tenant: listingTenantPreviewSchema,
});

export const listingDetailsSchema = listingCardSchema.extend({
  description: z.string().min(1),
  amenities: z.array(z.string().min(1)),
  propertyNotes: z.string().optional(),
  availableTo: isoDateStringSchema.optional(),
  photos: z.array(listingPhotoSchema).default([]),
  video: listingVideoSchema.optional(),
  tenant: listingTenantDetailsSchema,
  contactInfo: listingContactInfoSchema.optional(),
});

export const listingFiltersSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    county: z.string().optional(),
    neighborhood: z.string().optional(),
    neighborhoods: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => {
        if (!value) {
          return undefined;
        }

        if (Array.isArray(value)) {
          return value.flatMap((entry) =>
            entry
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean),
          );
        }

        return value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
      }),
    minRent: z.coerce.number().int().positive().optional(),
    maxRent: z.coerce.number().int().positive().optional(),
    bedrooms: z.coerce.number().int().min(0).max(10).optional(),
    bathrooms: z.coerce.number().int().min(0).max(10).optional(),
    availableFrom: z.string().date().optional(),
    availableTo: z.string().date().optional(),
    furnished: z.coerce.boolean().optional(),
    sortBy: z.enum(['createdAt', 'monthlyRent']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine((value, context) => {
    if (
      value.minRent !== undefined &&
      value.maxRent !== undefined &&
      value.minRent > value.maxRent
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxRent'],
        message: 'maxRent must be greater than or equal to minRent',
      });
    }
  });

export const myListingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  status: z.nativeEnum(ListingStatus).optional(),
});

export const createListingResponseSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(ListingStatus),
  message: z.string().min(1),
  unlockCostCredits: z.number().int().positive(),
  commission: z.number().int().nonnegative(),
  estimatedApprovalTime: z.string().min(1).optional(),
});

export const updateListingResponseSchema = z.object({
  id: z.string().min(1),
  message: z.string().min(1),
  updatedAt: isoDateStringSchema,
});

export const myListingSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(ListingStatus),
  monthlyRent: z.number().int().positive(),
  neighborhood: z.string().min(1),
  viewCount: z.number().int().nonnegative(),
  unlockCount: z.number().int().nonnegative(),
  totalEarnings: z.number().int().nonnegative(),
  pendingEarnings: z.number().int().nonnegative(),
  createdAt: isoDateStringSchema,
});

export const paginatedListingsResponseSchema = z.object({
  data: z.array(listingCardSchema),
  pagination: listingPaginationSchema,
});

export const paginatedMyListingsResponseSchema = z.object({
  data: z.array(myListingSchema),
  pagination: listingPaginationSchema,
});

export const legacyPaginatedListingsResponseSchema = z.object({
  data: z.array(listingCardSchema),
  meta: paginationMetaSchema,
});

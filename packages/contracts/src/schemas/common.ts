import { z } from 'zod';

export const phoneNumberSchema = z.string().regex(/^\+254\d{9}$/, {
  message: 'Must be valid Kenyan format (+254XXXXXXXXX)',
});

export const isoDateStringSchema = z.string().datetime();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    statusCode: z.number().int().positive(),
    details: z.unknown().optional(),
  }),
  meta: z.object({
    requestId: z.string().min(1),
    path: z.string().min(1),
    timestamp: isoDateStringSchema,
  }),
});

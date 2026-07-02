/**
 * Purpose: Zod schemas for the admin dispute queue query and response.
 * Why important: Validates status filtering and pagination for the console's
 *   dispute workflow.
 * Used by: apps/api modules/admin, apps/web /admin/disputes page.
 */
import { z } from 'zod';
import { DisputeStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const adminDisputesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DisputeStatus).optional(),
});

export const adminDisputeSummarySchema = z.object({
  id: z.string().min(1),
  unlockId: z.string().min(1),
  status: z.nativeEnum(DisputeStatus),
  reason: z.string(),
  evidenceCount: z.number().int().nonnegative(),
  reportedBy: z.object({
    id: z.string().min(1),
    firstName: z.string(),
    lastName: z.string(),
  }),
  listing: z.object({
    id: z.string().min(1),
    county: z.string(),
    neighborhood: z.string(),
  }),
  resolution: z.string().nullable(),
  resolvedAt: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
});

export const adminDisputesResponseSchema = z.object({
  data: z.array(adminDisputeSummarySchema),
  meta: paginationMetaSchema,
});

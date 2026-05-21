/**
 * Purpose: Zod schemas validating support-ticket request/response payloads.
 * Why important: The API validates inbound traffic against these schemas;
 *   keeping them in @pataspace/contracts means web and mobile can reuse the
 *   exact same types and refinements.
 * Used by: apps/api support module (zod validation pipe), web support form.
 */
import { z } from 'zod';
import { SupportTicketStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const createSupportTicketSchema = z.object({
  subject: z.string().min(2).max(120),
  message: z.string().min(10).max(2000),
  relatedUnlockId: z.string().min(1).optional(),
});

export const supportTicketsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SupportTicketStatus).optional(),
});

export const supportTicketRecordSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  status: z.nativeEnum(SupportTicketStatus),
  relatedUnlockId: z.string().min(1).nullable(),
  channel: z.string().nullable(),
  adminNotes: z.string().nullable(),
  resolvedAt: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const paginatedSupportTicketsResponseSchema = z.object({
  data: z.array(supportTicketRecordSchema),
  pagination: paginationMetaSchema.extend({
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

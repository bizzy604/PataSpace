/**
 * Purpose: Zod schemas for the admin support workspace — the triage queue
 *   query, the queue/detail responses, and the status + priority actions.
 * Why important: The workspace drives real ticket state transitions and admin
 *   replies; these schemas keep the console and API in lockstep.
 * Used by: apps/api modules/admin, apps/web /admin/support page.
 */
import { z } from 'zod';
import { SupportTicketPriority, SupportTicketStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';
import { supportTicketMessageRecordSchema } from './support';

export const adminSupportTicketsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

const supportReporterSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
});

export const adminSupportTicketSummarySchema = z.object({
  id: z.string().min(1),
  subject: z.string(),
  status: z.nativeEnum(SupportTicketStatus),
  priority: z.nativeEnum(SupportTicketPriority),
  reporter: supportReporterSchema,
  assignedToId: z.string().nullable(),
  messageCount: z.number().int().nonnegative(),
  lastMessageAt: isoDateStringSchema.nullable(),
  relatedUnlockId: z.string().nullable(),
  createdAt: isoDateStringSchema,
});

export const adminSupportTicketsResponseSchema = z.object({
  data: z.array(adminSupportTicketSummarySchema),
  meta: paginationMetaSchema,
});

export const adminSupportTicketDetailSchema = z.object({
  id: z.string().min(1),
  subject: z.string(),
  status: z.nativeEnum(SupportTicketStatus),
  priority: z.nativeEnum(SupportTicketPriority),
  assignedToId: z.string().nullable(),
  channel: z.string().nullable(),
  adminNotes: z.string().nullable(),
  relatedUnlockId: z.string().nullable(),
  reporter: supportReporterSchema.extend({
    phoneNumber: z.string().nullable(),
    createdAt: isoDateStringSchema,
  }),
  messages: z.array(supportTicketMessageRecordSchema),
  resolvedAt: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const updateSupportTicketStatusSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus),
});

export const updateSupportTicketPrioritySchema = z.object({
  priority: z.nativeEnum(SupportTicketPriority),
});

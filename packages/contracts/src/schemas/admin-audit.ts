/**
 * Purpose: Zod schemas for the admin audit-log surface — the filter query and
 *   the paginated record response the security console renders.
 * Why important: Audit rows carry oldValue/newValue payloads; validating the
 *   filter and shape keeps the diff view and CSV export honest.
 * Used by: apps/api modules/admin, apps/web /admin/audit-logs page.
 */
import { z } from 'zod';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

export const adminAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().trim().min(1).max(64).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  entityId: z.string().trim().min(1).max(64).optional(),
  adminUserId: z.string().trim().min(1).max(64).optional(),
  from: isoDateStringSchema.optional(),
  to: isoDateStringSchema.optional(),
});

export const adminAuditLogRecordSchema = z.object({
  id: z.string().min(1),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  admin: z
    .object({
      id: z.string().min(1),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  oldValue: z.unknown().nullable(),
  newValue: z.unknown().nullable(),
  metadata: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: isoDateStringSchema,
});

export const adminAuditLogsResponseSchema = z.object({
  data: z.array(adminAuditLogRecordSchema),
  meta: paginationMetaSchema,
});

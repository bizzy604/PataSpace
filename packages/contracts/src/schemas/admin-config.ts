/**
 * Purpose: Zod schemas for the admin system-config surface — the effective
 *   config listing and the per-key update payload.
 * Why important: These knobs drive live pricing; the update schema is the
 *   first gate before a value reaches the runtime resolver.
 * Used by: apps/api modules/admin, apps/web /admin/config page.
 */
import { z } from 'zod';
import { isoDateStringSchema } from './common';

export const adminConfigEntrySchema = z.object({
  key: z.string().min(1),
  group: z.enum(['PRICING', 'INCENTIVES']),
  label: z.string(),
  description: z.string(),
  unit: z.string(),
  kind: z.enum(['int', 'ratio']),
  value: z.number(),
  source: z.enum(['default', 'override']),
  min: z.number(),
  max: z.number(),
  updatedAt: isoDateStringSchema.nullable(),
});

export const adminConfigResponseSchema = z.object({
  data: z.array(adminConfigEntrySchema),
});

export const updateConfigSchema = z.object({
  value: z.number().finite(),
});

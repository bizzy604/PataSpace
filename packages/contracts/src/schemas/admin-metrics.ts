/**
 * Purpose: Zod schema for the admin dashboard metrics payload.
 * Why important: Validates the aggregation the API returns so a broken count
 *   query surfaces as a contract error, not a blank dashboard tile.
 * Used by: apps/api modules/admin, apps/web /admin dashboard.
 */
import { z } from 'zod';
import { isoDateStringSchema } from './common';

const countSchema = z.number().int().nonnegative();

export const adminMetricsResponseSchema = z.object({
  users: z.object({
    total: countSchema,
    banned: countSchema,
    newLast7Days: countSchema,
  }),
  listings: z.object({
    total: countSchema,
    pending: countSchema,
    active: countSchema,
    rejected: countSchema,
  }),
  unlocks: z.object({
    total: countSchema,
    last7Days: countSchema,
  }),
  disputes: z.object({
    open: countSchema,
    investigating: countSchema,
  }),
  commissions: z.object({
    pendingCount: countSchema,
    pendingAmountKES: countSchema,
    paidCount: countSchema,
    paidAmountKES: countSchema,
  }),
  supportTickets: z.object({
    open: countSchema,
  }),
  generatedAt: isoDateStringSchema,
});

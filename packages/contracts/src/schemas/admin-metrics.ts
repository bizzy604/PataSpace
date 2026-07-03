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
  // Landlord-awareness pilot metric (spec section 4.2): if landlord_declined
  // exceeds ~20% of refunds, the landlord-claim flow gets prioritized.
  trust: z.object({
    refundsTotal: countSchema,
    landlordDeclinedRefunds: countSchema,
    landlordDeclinedShare: z.number().min(0).max(1),
  }),
  // Supply flywheel metric (spec section 4.6): target mover-to-poster > 25%.
  flywheel: z.object({
    confirmedMoveIns: countSchema,
    seededListings: countSchema,
    moverToPosterRate: z.number().min(0).max(1),
  }),
  successFees: z.object({
    partialCount: countSchema,
    settledCount: countSchema,
    collectedKes: countSchema,
  }),
  generatedAt: isoDateStringSchema,
});

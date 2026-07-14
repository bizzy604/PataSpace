/**
 * Purpose: Zod schemas for the admin finance surface — payout summary, the
 *   commission payout ledger query/response, and the retry action result.
 * Why important: Validates the money numbers the console renders and the
 *   single mutating action (retry a failed payout) so a bad shape is a
 *   contract error, not a silent wrong figure on a financial screen.
 * Used by: apps/api modules/admin, apps/web /admin/finance page.
 */
import { z } from 'zod';
import { CommissionStatus } from '../enums';
import { isoDateStringSchema, paginationMetaSchema, paginationQuerySchema } from './common';

const moneyBucketSchema = z.object({
  amountKES: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export const adminFinanceSummaryResponseSchema = z.object({
  // Owed to posters and still in flight (PENDING + DUE + PROCESSING).
  pendingPayouts: moneyBucketSchema.extend({
    partners: z.number().int().nonnegative(),
  }),
  // Terminal failures a human must requeue.
  failedPayouts: moneyBucketSchema,
  // PAID rows settled this calendar month / this calendar year.
  paidThisMonth: moneyBucketSchema,
  paidYearToDate: moneyBucketSchema,
  generatedAt: isoDateStringSchema,
});

export const adminFinanceTransactionsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(CommissionStatus).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const adminPayoutRecordSchema = z.object({
  id: z.string().min(1),
  unlockId: z.string().min(1),
  status: z.nativeEnum(CommissionStatus),
  amountKES: z.number().int().nonnegative(),
  mpesaReceiptNumber: z.string().nullable(),
  paymentAttempts: z.number().int().nonnegative(),
  lastAttemptError: z.string().nullable(),
  payee: z.object({
    id: z.string().min(1),
    firstName: z.string(),
    lastName: z.string(),
  }),
  listing: z.object({
    id: z.string().min(1),
    county: z.string(),
    neighborhood: z.string(),
  }),
  eligibleAt: isoDateStringSchema,
  paidAt: isoDateStringSchema.nullable(),
  createdAt: isoDateStringSchema,
});

export const adminPayoutLedgerResponseSchema = z.object({
  data: z.array(adminPayoutRecordSchema),
  meta: paginationMetaSchema,
});

export const adminRetryPayoutResponseSchema = z.object({
  commissionId: z.string().min(1),
  // Outcome from the inline processor run; 'requeued' means the row was
  // handed back to the daily sweep without an immediate send.
  outcome: z.enum(['paid', 'submitted', 'retry', 'dead-letter', 'skipped', 'requeued']),
  status: z.nativeEnum(CommissionStatus),
});

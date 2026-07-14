/**
 * Purpose: Transport types for the admin finance surface — summary tiles, the
 *   commission payout ledger, and the retry-payout action result.
 * Why important: Both the API and the console import these so a payout figure
 *   or ledger row never drifts in shape between the two sides.
 * Used by: apps/api modules/admin, apps/web /admin/finance page.
 */
import { CommissionStatus } from '../enums';
import { PaginationMeta } from './common';

export type AdminFinanceMoneyBucket = {
  amountKES: number;
  count: number;
};

export type AdminFinanceSummaryResponse = {
  pendingPayouts: AdminFinanceMoneyBucket & { partners: number };
  failedPayouts: AdminFinanceMoneyBucket;
  paidThisMonth: AdminFinanceMoneyBucket;
  paidYearToDate: AdminFinanceMoneyBucket;
  generatedAt: string;
};

export type AdminPayoutRecord = {
  id: string;
  unlockId: string;
  status: CommissionStatus;
  amountKES: number;
  mpesaReceiptNumber: string | null;
  paymentAttempts: number;
  lastAttemptError: string | null;
  payee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  listing: {
    id: string;
    county: string;
    neighborhood: string;
  };
  eligibleAt: string;
  paidAt: string | null;
  createdAt: string;
};

export type AdminPayoutLedgerResponse = {
  data: AdminPayoutRecord[];
  meta: PaginationMeta;
};

export type AdminRetryPayoutOutcome =
  | 'paid'
  | 'submitted'
  | 'retry'
  | 'dead-letter'
  | 'skipped'
  | 'requeued';

export type AdminRetryPayoutResponse = {
  commissionId: string;
  outcome: AdminRetryPayoutOutcome;
  status: CommissionStatus;
};

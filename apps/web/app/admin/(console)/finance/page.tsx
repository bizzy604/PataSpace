/**
 * Purpose: Admin finance route — payout summary and the commission payout
 *   ledger with the retry-failed-payout action.
 * Why important: Entry point for the reconciliation surface; failed B2C
 *   payouts become visible and requeuable here.
 * Used by: /admin/finance (inside AdminShell).
 */
import { FinancePanel } from '@/components/admin/finance-panel';

export default function AdminFinancePage() {
  return <FinancePanel />;
}

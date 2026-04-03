import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { TransactionsDataTable } from '@/components/tables/transactions-data-table';
import { mockTransactions } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const completedPurchases = mockTransactions.filter((transaction) => transaction.type === 'PURCHASE');
  const refundedAmount = mockTransactions
    .filter((transaction) => transaction.type === 'REFUND')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <TenantWorkspaceShell
      pathname="/wallet/transactions"
      title="Transaction history"
      description="A full ledger of wallet purchases, unlock spend, and refunds tied to the tenant account."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>
            Buy credits
          </Link>
          <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Wallet overview
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Completed purchases"
          value={`${completedPurchases.length}`}
          hint="All successful top-ups from the wallet surface."
          Icon={ReceiptText}
        />
        <MetricCard
          label="Refunded value"
          value={formatKes(refundedAmount)}
          hint="Value returned through dispute or invalid listing resolution."
        />
        <MetricCard
          label="Latest receipt"
          value={completedPurchases[0]?.mpesaReceiptNumber ?? 'N/A'}
          hint="The most recent completed purchase receipt number in the ledger."
        />
      </div>

      <div className="mt-6">
        <TransactionsDataTable data={mockTransactions} />
      </div>
    </TenantWorkspaceShell>
  );
}

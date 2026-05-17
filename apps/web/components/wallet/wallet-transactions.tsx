'use client';
/**
 * Purpose: Transaction history page — full paginated ledger of credits activity.
 * Why important: Provides the complete audit trail for all wallet events.
 * Used by: components/wallet/page.tsx (re-export barrel).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, History, Wallet2 } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { TransactionsDataTable } from '@/components/tables/transactions-data-table';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { fetchTransactions } from '@/lib/api/credits';
import type { CreditTransaction } from '@pataspace/contracts';

export function WalletTransactionHistoryPage() {
  const { getToken } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    fetchTransactions(getToken, 1, 100).then((r) => setTransactions(r.data)).catch(() => null);
  }, [getToken]);

  const totalPurchases = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpend = Math.abs(transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const receiptCount = transactions.filter((t) => t.mpesaReceiptNumber).length;

  return (
    <TenantWorkspaceShell
      pathname="/wallet/transactions"
      title="Transaction history"
      description="Every purchase, unlock deduction, and refund lives in one auditable wallet ledger."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>Buy credits</Link>
          <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>Wallet overview</Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Credits added" value={formatKes(totalPurchases)} hint="Completed purchases and refunds that increased the balance." Icon={Wallet2} />
        <MetricCard label="Credits spent" value={formatKes(totalSpend)} hint="Ledger spend tied to unlock activity so every deduction remains traceable." Icon={ArrowRight} />
        <MetricCard label="Receipts available" value={`${receiptCount}`} hint="Purchase receipts can be cross-checked against M-Pesa metadata." Icon={History} />
      </div>
      <div className="mt-6">
        <TransactionsDataTable data={transactions} />
      </div>
    </TenantWorkspaceShell>
  );
}

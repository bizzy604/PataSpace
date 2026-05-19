'use client';
/**
 * Purpose: Wallet overview page — shows current balance, top-up packages, and recent transactions.
 * Why important: Entry point for the credit wallet; users see balance and recent activity at a glance.
 * Used by: components/wallet/page.tsx (re-export barrel).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { History, ShieldCheck, Smartphone, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge, transactionStatusMeta, transactionTypeMeta } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { creditPackages } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { fetchCreditBalance, fetchTransactions } from '@/lib/api/credits';
import type { CreditBalance, CreditTransaction } from '@pataspace/contracts';

export function WalletOverviewPage() {
  const { getToken } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    fetchCreditBalance(getToken).then(setBalance).catch(() => null);
    fetchTransactions(getToken, 1, 3).then((r) => setTransactions(r.data)).catch(() => null);
  }, [getToken]);

  const coverage = balance ? Math.max(1, Math.floor(balance.balance / 2500)) : 0;
  const refundCount = transactions.filter((t) => t.type === 'REFUND').length;
  const completedPurchases = transactions.filter((t) => t.type === 'PURCHASE').length;

  return (
    <TenantWorkspaceShell
      pathname="/wallet"
      title="Credits wallet"
      description="Track your current balance, top up with M-Pesa, and follow the full ledger from wallet funding through unlock spend and refunds."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>Buy credits</Link>
          <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Transaction history
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div className="space-y-6">
          <Card className="h-fit border border-primary bg-primary text-primary-foreground shadow-md">
            <CardHeader className="pb-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Available balance</p>
              <CardTitle className="text-4xl font-semibold text-primary-foreground">
                {balance ? formatKes(balance.balance) : '—'}
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-6 text-primary-foreground/75">
                Roughly {coverage} serious unlocks at the current average spend, with refunds and purchases preserved in the same ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {[
                { label: 'Lifetime funded', value: balance ? formatKes(balance.lifetimeEarned) : '—' },
                { label: 'Lifetime spent', value: balance ? formatKes(balance.lifetimeSpent) : '—' },
                { label: 'Completed top-ups', value: `${completedPurchases}` },
              ].map((item) => (
                <div key={item.label} className="border border-primary-foreground/20 bg-primary-foreground/10 p-3.5">
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-primary-foreground/60">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-primary-foreground">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">Top-up packages</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Choose a package, then continue to the M-Pesa payment screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditPackages.map((pkg) => {
                const isRecommended = 'recommended' in pkg && Boolean(pkg.recommended);
                return (
                  <div
                    key={pkg.id}
                    className={`border p-5 ${isRecommended ? 'border-primary bg-primary/5' : 'border-border bg-muted'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-2xl font-semibold text-foreground">{pkg.name}</p>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{pkg.description}</p>
                      </div>
                      {isRecommended ? <StatusBadge label="Recommended" tone="brand" /> : null}
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-foreground sm:grid-cols-2">
                      <p className="border border-border bg-card px-4 py-3">Amount: {formatKes(pkg.amount)}</p>
                      <p className="border border-border bg-card px-4 py-3">Credits: {pkg.credits}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid auto-rows-min gap-3 self-start md:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="Unlock-ready" value={`${coverage}`} hint="Approximate unlocks at current average spend." Icon={Wallet2} />
            <MetricCard label="Protected refunds" value={`${refundCount}`} hint="Refunds flow back into the wallet balance." Icon={ShieldCheck} />
            <MetricCard label="Mobile-first funding" value="M-Pesa" hint="Top-ups stay aligned with the M-Pesa-first purchase flow." Icon={Smartphone} />
          </div>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">Recent ledger activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.map((transaction) => {
                const type = transactionTypeMeta(transaction.type);
                const status = transactionStatusMeta(transaction.status);
                return (
                  <div key={transaction.id} className="border border-border bg-muted p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={type.label} tone={type.tone} />
                      <StatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <p className="mt-3 font-medium text-foreground">{transaction.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>{formatDateLabel(transaction.createdAt)}</span>
                      <span className={transaction.amount < 0 ? 'font-semibold text-destructive' : 'font-semibold text-primary'}>
                        {transaction.amount < 0 ? '-' : '+'}{formatKes(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
              <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                Open full history <History className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantWorkspaceShell>
  );
}

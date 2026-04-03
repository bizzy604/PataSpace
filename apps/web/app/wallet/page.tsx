import Link from 'next/link';
import { ArrowRight, Banknote, History, Sparkles, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { mockCreditBalance, mockTransactions, creditPackages } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const recentTransactions = mockTransactions.slice(0, 3);
  const projectedUnlocks = Math.floor(mockCreditBalance.balance / 2500);

  return (
    <TenantWorkspaceShell
      pathname="/wallet"
      title="Wallet overview"
      description="Track your current balance, recent purchases, refund protection, and the quickest paths back into browsing or unlock follow-through."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>
            Buy credits
          </Link>
          <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            View history
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Available balance"
          value={formatKes(mockCreditBalance.balance)}
          hint="Credits available right now for unlocking or future browsing decisions."
          Icon={Wallet2}
        />
        <MetricCard
          label="Projected unlocks"
          value={`${projectedUnlocks}`}
          hint="Based on a typical unlock cost around KES 2,500 in the current listing mix."
          Icon={Sparkles}
        />
        <MetricCard
          label="Lifetime spent"
          value={formatKes(mockCreditBalance.lifetimeSpent)}
          hint="Total credit value spent across all unlocks and related browsing actions."
          Icon={Banknote}
        />
        <MetricCard
          label="Refund protection"
          value="1 resolved"
          hint="One prior dispute was refunded, which is reflected in the ledger and unlock history."
          Icon={History}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Credit packages
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              M-Pesa top-ups follow the package structure already modeled in the web mock state.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {creditPackages.map((pkg) => (
              (() => {
                const isRecommended = 'recommended' in pkg && pkg.recommended;

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[28px] border p-5 ${isRecommended ? 'border-[#28809A]/24 bg-[#28809A] text-white' : 'border-black/8 bg-[#fbfaf7]'}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {pkg.name}
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em]">
                      {formatKes(pkg.amount)}
                    </p>
                    <p className={`mt-1 text-sm ${isRecommended ? 'text-white/72' : 'text-[#62686a]'}`}>
                      {pkg.credits} credits
                    </p>
                    <p className={`mt-4 text-sm leading-7 ${isRecommended ? 'text-white/80' : 'text-[#62686a]'}`}>
                      {pkg.description}
                    </p>
                    <Link
                      href="/wallet/buy"
                      className={`mt-5 inline-flex items-center gap-2 text-sm font-medium ${isRecommended ? 'text-white' : 'text-[#28809A]'}`}
                    >
                      Continue to checkout
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                );
              })()
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#252525]">{transaction.description}</p>
                  <p className={transaction.amount < 0 ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}>
                    {transaction.amount < 0 ? '-' : '+'}
                    {formatKes(Math.abs(transaction.amount))}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#62686a]">
                  Balance after transaction: {formatKes(transaction.balanceAfter)}
                </p>
              </div>
            ))}

            <Link href="/wallet/transactions" className="inline-flex items-center gap-2 text-sm font-medium text-[#28809A]">
              Open full transaction history
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

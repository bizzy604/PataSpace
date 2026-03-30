import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyStat } from '@/components/shared/key-stat';
import { PageIntro } from '@/components/shared/page-intro';
import { TransactionCard } from '@/components/wallet/transaction-card';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { creditPackages, mockCreditBalance, mockTransactions } from '@/lib/mock-app-state';

export default function WalletPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        badge="Wallet overview"
        kicker="Credits and payments"
        title="Track credits, purchases, and spend from one web wallet."
        description="This route is aligned with the backend credit balance, purchase, and transaction history endpoints."
        actions={
          <>
            <Link href="/wallet/buy" className={linkButtonVariants()}>
              Buy credits
            </Link>
            <Link href="/wallet/transactions" className={linkButtonVariants({ variant: 'outline' })}>
              Full transaction history
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KeyStat label="Current balance" value={formatKes(mockCreditBalance.balance)} />
        <KeyStat label="Lifetime earned" value={formatKes(mockCreditBalance.lifetimeEarned)} />
        <KeyStat label="Lifetime spent" value={formatKes(mockCreditBalance.lifetimeSpent)} />
        <KeyStat label="Pending commissions" value={formatKes(mockCreditBalance.pendingCommissions)} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Buy packages built for unlock speed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{pkg.name}</p>
                    <p className="mt-1 text-white/68">{pkg.description}</p>
                  </div>
                  <span className="rounded-full bg-[#67d1e3]/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#67d1e3]">
                    {pkg.credits} credits
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                  {formatKes(pkg.amount)}
                </p>
              </div>
            ))}
            <Link href="/wallet/buy" className="inline-flex items-center gap-2 text-sm font-semibold text-[#67d1e3]">
              Continue to M-Pesa package selection
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {mockTransactions.slice(0, 3).map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </div>
    </section>
  );
}

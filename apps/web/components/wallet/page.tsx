import Link from 'next/link';
import { ArrowRight, CreditCard, History, ShieldCheck, Smartphone, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge, transactionStatusMeta, transactionTypeMeta } from '@/components/shared/status-badge';
import { TransactionsDataTable } from '@/components/tables/transactions-data-table';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { creditPackages, mockCreditBalance, mockTransactions } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export function WalletOverviewPage() {
  const completedPurchases = mockTransactions.filter((transaction) => transaction.type === 'PURCHASE').length;
  const recentTransactions = mockTransactions.slice(0, 3);
  const coverage = Math.max(1, Math.floor(mockCreditBalance.balance / 2500));

  return (
    <TenantWorkspaceShell
      pathname="/wallet"
      title="Credits wallet"
      description="Track your current balance, top up with M-Pesa, and follow the full ledger from wallet funding through unlock spend and refunds."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>
            Buy credits
          </Link>
          <Link
            href="/wallet/transactions"
            className={linkButtonClass({ variant: 'outline', size: 'sm' })}
          >
            Transaction history
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div className="space-y-6">
          <Card className="h-fit border border-black/8 bg-[linear-gradient(135deg,#28809A_0%,#252525_100%)] text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
            <CardHeader className="pb-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/60">Available balance</p>
              <CardTitle className="font-display text-4xl font-semibold tracking-[-0.07em] text-white">
                {formatKes(mockCreditBalance.balance)}
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-6 text-white/74">
                Roughly {coverage} serious unlocks at the current average spend, with refunds and purchases preserved in the same ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {[
                { label: 'Lifetime funded', value: formatKes(mockCreditBalance.lifetimeEarned) },
                { label: 'Lifetime spent', value: formatKes(mockCreditBalance.lifetimeSpent) },
                { label: 'Completed top-ups', value: `${completedPurchases}` },
              ].map((item) => (
                <div key={item.label} className="rounded-[18px] border border-white/10 bg-white/8 p-3.5">
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/54">{item.label}</p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Top-up packages
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Choose a package, then continue to the M-Pesa payment screen. Unlock charges still follow the 10% of monthly rent rule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditPackages.map((pkg) => {
                const isRecommended = 'recommended' in pkg && Boolean(pkg.recommended);

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[24px] border p-5 ${
                      isRecommended
                        ? 'border-[#28809A]/30 bg-[#28809A]/8'
                        : 'border-black/8 bg-[#fbfaf7]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                          {pkg.name}
                        </p>
                        <p className="mt-1 text-sm leading-7 text-[#62686a]">{pkg.description}</p>
                      </div>
                      {isRecommended ? <StatusBadge label="Recommended" tone="brand" /> : null}
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[#4b4f50] sm:grid-cols-2">
                      <p className="rounded-[18px] bg-white px-4 py-3">Amount: {formatKes(pkg.amount)}</p>
                      <p className="rounded-[18px] bg-white px-4 py-3">Credits: {pkg.credits}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid auto-rows-min gap-3 self-start md:grid-cols-3 xl:grid-cols-1">
            <MetricCard
              label="Unlock-ready"
              value={`${coverage}`}
              hint="Approximate number of unlocks the current balance can cover at the recent average spend."
              Icon={Wallet2}
            />
            <MetricCard
              label="Protected refunds"
              value={`${mockTransactions.filter((transaction) => transaction.type === 'REFUND').length}`}
              hint="Refunds flow back into the same wallet balance without breaking the ledger history."
              Icon={ShieldCheck}
            />
            <MetricCard
              label="Mobile-first funding"
              value="M-Pesa"
              hint="Wallet top-ups stay aligned with the M-Pesa-first purchase flow documented in the wireframes."
              Icon={Smartphone}
            />
          </div>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Recent ledger activity
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Purchases, unlock deductions, and refunds all stay visible from one wallet surface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => {
                const type = transactionTypeMeta(transaction.type);
                const status = transactionStatusMeta(transaction.status);

                return (
                  <div key={transaction.id} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={type.label} tone={type.tone} />
                      <StatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <p className="mt-3 font-medium text-[#252525]">{transaction.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#62686a]">
                      <span>{formatDateLabel(transaction.createdAt)}</span>
                      <span className={transaction.amount < 0 ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}>
                        {transaction.amount < 0 ? '-' : '+'}
                        {formatKes(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  </div>
                );
              })}

              <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                Open full history
                <History className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantWorkspaceShell>
  );
}

export function WalletBuyPage() {
  const selectedPackage =
    creditPackages.find((pkg) => 'recommended' in pkg && Boolean(pkg.recommended)) ?? creditPackages[0];

  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="Buy credits"
      description="Use the M-Pesa-first funding flow to add credits before unlocking direct tenant contact."
      actions={
        <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to wallet
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Payment summary
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              The selected package, phone number, and M-Pesa flow stay explicit before the STK prompt is issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[28px] border border-black/8 bg-[#252525] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">Selected package</p>
              <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em]">{selectedPackage.name}</p>
              <div className="mt-4 grid gap-3 text-sm text-white/74 sm:grid-cols-2">
                <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
                  Amount: {formatKes(selectedPackage.amount)}
                </p>
                <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
                  Credits: {selectedPackage.credits}
                </p>
              </div>
            </div>

            <label className="space-y-2 text-sm font-medium text-[#252525]">
              M-Pesa phone number
              <Input className="h-11 rounded-2xl" defaultValue="+254701234567" />
            </label>

            <div className="rounded-[24px] border border-[#28809A]/14 bg-[#28809A]/7 p-5">
              <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                <Smartphone className="size-4 text-[#28809A]" />
                How it works
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#4b4f50]">
                <p>1. Confirm the phone number that should receive the STK prompt.</p>
                <p>2. Approve the payment on your device using your M-Pesa PIN.</p>
                <p>3. The wallet ledger updates immediately when the callback completes.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/wallet/processing" className={linkButtonClass({ size: 'sm' })}>
                Send STK prompt
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                Review payment history
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Available packages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditPackages.map((pkg) => (
              <div key={pkg.id} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#252525]">{pkg.name}</p>
                    <p className="text-sm leading-7 text-[#62686a]">{pkg.description}</p>
                  </div>
                  <CreditCard className="size-5 text-[#28809A]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#4b4f50]">
                  <span className="rounded-full border border-black/8 bg-white px-3 py-1">{formatKes(pkg.amount)}</span>
                  <span className="rounded-full border border-black/8 bg-white px-3 py-1">{pkg.credits} credits</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

export function WalletTransactionHistoryPage() {
  const totalPurchases = mockTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalSpend = Math.abs(
    mockTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  return (
    <TenantWorkspaceShell
      pathname="/wallet/transactions"
      title="Transaction history"
      description="Every purchase, unlock deduction, and refund lives in one auditable wallet ledger."
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
          label="Credits added"
          value={formatKes(totalPurchases)}
          hint="Completed purchases and refunds that increased the balance."
          Icon={Wallet2}
        />
        <MetricCard
          label="Credits spent"
          value={formatKes(totalSpend)}
          hint="Ledger spend tied to unlock activity so every deduction remains traceable."
          Icon={ArrowRight}
        />
        <MetricCard
          label="Receipts available"
          value={`${mockTransactions.filter((transaction) => transaction.mpesaReceiptNumber).length}`}
          hint="Purchase receipts can be cross-checked against M-Pesa metadata in the detail screen."
          Icon={History}
        />
      </div>

      <div className="mt-6">
        <TransactionsDataTable data={mockTransactions} />
      </div>
    </TenantWorkspaceShell>
  );
}

'use client';
/**
 * Purpose: Wallet page barrel — re-exports all wallet page components.
 * Why important: Keeps app route imports stable while sub-modules stay independently sized.
 * Used by: app/wallet/page.tsx, app/wallet/buy/page.tsx, app/wallet/transactions/page.tsx.
 */
import Link from 'next/link';
import { ArrowRight, CreditCard, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { creditPackages } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export { WalletOverviewPage } from './wallet-overview';
export { WalletTransactionHistoryPage } from './wallet-transactions';

export function WalletBuyPage() {
  const selectedPackage =
    creditPackages.find((pkg) => 'recommended' in pkg && Boolean(pkg.recommended)) ?? creditPackages[0]!;

  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="Buy credits"
      description="Use the M-Pesa-first funding flow to add credits before unlocking direct tenant contact."
      actions={<Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>Back to wallet</Link>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">Payment summary</CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              The selected package, phone number, and M-Pesa flow stay explicit before the STK prompt is issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[28px] border border-black/8 bg-[#252525] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">Selected package</p>
              <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em]">{selectedPackage.name}</p>
              <div className="mt-4 grid gap-3 text-sm text-white/74 sm:grid-cols-2">
                <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">Amount: {formatKes(selectedPackage.amount)}</p>
                <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">Credits: {selectedPackage.credits}</p>
              </div>
            </div>
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              M-Pesa phone number
              <Input className="h-11 rounded-2xl" placeholder="+254700000000" />
            </label>
            <div className="rounded-[24px] border border-[#28809A]/14 bg-[#28809A]/7 p-5">
              <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                <Smartphone className="size-4 text-[#28809A]" /> How it works
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#4b4f50]">
                <p>1. Confirm the phone number that should receive the STK prompt.</p>
                <p>2. Approve the payment on your device using your M-Pesa PIN.</p>
                <p>3. The wallet ledger updates immediately when the callback completes.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/wallet/processing" className={linkButtonClass({ size: 'sm' })}>
                Send STK prompt <ArrowRight className="size-4" />
              </Link>
              <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                Review payment history
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">Available packages</CardTitle>
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

'use client';
/**
 * Purpose: Wallet page barrel — re-exports overview and transactions; owns the buy credits flow.
 * Why important: Keeps app route imports stable while sub-modules stay independently sized.
 * Used by: app/wallet/page.tsx, app/wallet/buy/page.tsx, app/wallet/transactions/page.tsx.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, CheckCircle2, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { purchaseCredits } from '@/lib/api/credits';
import type { CreditPurchasePackage } from '@pataspace/contracts';
import { cn } from '@/lib/utils';

export { WalletOverviewPage } from './wallet-overview';
export { WalletTransactionHistoryPage } from './wallet-transactions';

const creditPackages = [
  { id: '5_credits' as CreditPurchasePackage, name: 'Starter', amount: 500, credits: 5, description: 'A small top-up for one lower-rent unlock.' },
  { id: '10_credits' as CreditPurchasePackage, name: 'Search Sprint', amount: 1000, credits: 10, description: 'Balanced package for active weekly browsing.', recommended: true },
  { id: '20_credits' as CreditPurchasePackage, name: 'Fast Track', amount: 2000, credits: 20, description: 'Best for comparing multiple serious options quickly.' },
] as const;

function normalizeKenyanPhone(raw: string): string {
  const s = raw.trim().replace(/\s+/g, '');
  if (/^0\d{9}$/.test(s)) return '+254' + s.slice(1);
  if (/^254\d{9}$/.test(s)) return '+' + s;
  return s;
}

function isValidKenyanPhone(s: string): boolean {
  return /^\+254\d{9}$/.test(s);
}

export function WalletBuyPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selectedId, setSelectedId] = useState<CreditPurchasePackage>('10_credits');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPkg = creditPackages.find((p) => p.id === selectedId) ?? creditPackages[1];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeKenyanPhone(phone);
    if (!isValidKenyanPhone(normalized)) {
      setError('Enter a valid Kenyan number — e.g. 0712345678 or +254712345678.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseCredits(getToken, { package: selectedId, paymentMethod: 'mpesa', phoneNumber: normalized });
      router.push(
        `/wallet/processing?txn=${result.transactionId}&pkg=${encodeURIComponent(selectedPkg?.name ?? '')}&amount=${result.amount}&credits=${result.credits}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment request failed. Please try again.');
      setLoading(false);
    }
  }

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
              Confirm the package and phone number before the STK prompt is issued to your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-[28px] border border-black/8 bg-[#252525] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/56">Selected package</p>
                <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em]">{selectedPkg?.name}</p>
                <div className="mt-4 grid gap-3 text-sm text-white/74 sm:grid-cols-2">
                  <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">Amount: {formatKes(selectedPkg?.amount ?? 0)}</p>
                  <p className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">Credits: {selectedPkg?.credits}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#252525]">
                  M-Pesa phone number
                </label>
                <Input
                  className="h-11 rounded-2xl"
                  placeholder="0712 345 678 or +254712345678"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-[#62686a]">Kenyan number — local (07…) or international (+254…) format accepted.</p>
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
              ) : null}

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
                <button
                  type="submit"
                  disabled={loading}
                  className={linkButtonClass({ size: 'sm' }) + (loading ? ' opacity-60 cursor-not-allowed' : '')}
                >
                  {loading ? 'Sending prompt…' : 'Send STK prompt'}
                  {!loading && <ArrowRight className="size-4" />}
                </button>
                <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  Review payment history
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">Available packages</CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Click a package to select it, then enter your phone number above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditPackages.map((pkg) => {
              const isSelected = pkg.id === selectedId;
              const isRecommended = 'recommended' in pkg;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedId(pkg.id)}
                  className={cn(
                    'w-full rounded-[24px] border p-4 text-left transition',
                    isSelected
                      ? 'border-[#28809A] bg-[#28809A]/8 ring-1 ring-[#28809A]/40'
                      : 'border-black/8 bg-[#fbfaf7] hover:border-[#28809A]/30 hover:bg-white',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#252525]">{pkg.name}</p>
                      <p className="text-sm leading-7 text-[#62686a]">{pkg.description}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="size-5 text-[#28809A]" />
                    ) : isRecommended ? (
                      <span className="rounded-full bg-[#28809A]/10 px-2.5 py-1 text-xs font-semibold text-[#28809A]">Recommended</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#4b4f50]">
                    <span className="rounded-full border border-black/8 bg-white px-3 py-1">{formatKes(pkg.amount)}</span>
                    <span className="rounded-full border border-black/8 bg-white px-3 py-1">{pkg.credits} credits</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

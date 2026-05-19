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
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">Payment summary</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Confirm the package and phone number before the STK prompt is issued to your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border border-border bg-foreground p-5 text-background">
                <p className="text-xs font-semibold uppercase tracking-widest text-background/60">Selected package</p>
                <p className="mt-3 text-3xl font-semibold">{selectedPkg?.name}</p>
                <div className="mt-4 grid gap-3 text-sm text-background/70 sm:grid-cols-2">
                  <p className="border border-background/10 bg-background/10 px-4 py-3">Amount: {formatKes(selectedPkg?.amount ?? 0)}</p>
                  <p className="border border-background/10 bg-background/10 px-4 py-3">Credits: {selectedPkg?.credits}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  M-Pesa phone number
                </label>
                <Input
                  className="h-11"
                  placeholder="0712 345 678 or +254712345678"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Kenyan number — local (07…) or international (+254…) format accepted.</p>
              </div>

              {error ? (
                <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
              ) : null}

              <div className="border border-primary/20 bg-primary/5 p-5">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Smartphone className="size-4 text-primary" /> How it works
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
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

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">Available packages</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
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
                    'w-full border p-4 text-left transition',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border bg-muted hover:border-primary/30 hover:bg-card',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{pkg.name}</p>
                      <p className="text-sm leading-7 text-muted-foreground">{pkg.description}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : isRecommended ? (
                      <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Recommended</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="border border-border bg-card px-3 py-1">{formatKes(pkg.amount)}</span>
                    <span className="border border-border bg-card px-3 py-1">{pkg.credits} credits</span>
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

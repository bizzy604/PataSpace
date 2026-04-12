import Link from 'next/link';
import { CheckCircle2, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { mockTransactions } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const purchase = mockTransactions.find((transaction) => transaction.type === 'PURCHASE');

  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="Payment success"
      description="Completed top-ups should immediately be reflected in the wallet balance and the full transaction ledger."
    >
      <div className="mx-auto max-w-4xl">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Credits added successfully
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-[#62686a]">
                  The wallet has been refreshed and the transaction is now marked complete.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-black/8 bg-[#f7f4ee] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                Transaction summary
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#4b4f50]">
                <p className="flex items-center justify-between">
                  <span>Package</span>
                  <span>Fast Track</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Amount</span>
                  <span>{formatKes(2000)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Receipt</span>
                  <span>{purchase?.mpesaReceiptNumber}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Date</span>
                  <span>{purchase ? formatDateLabel(purchase.createdAt) : 'Today'}</span>
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-[#252525] p-5 text-white">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-white/76">
                <Wallet2 className="size-4 text-[#8ed7e7]" />
                Next best step
              </p>
              <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.06em]">
                Return to listings and unlock when ready
              </p>
              <p className="mt-3 text-sm leading-7 text-white/76">
                The ledger entry is permanent, so browsing, unlock checkout, and support can all refer back to the same payment if needed.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
                  Browse listings
                </Link>
                <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  View receipt
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

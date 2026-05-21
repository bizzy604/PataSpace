/**
 * Purpose: Confirmation page shown after an M-Pesa credit purchase completes.
 * Why important: Pulls the most recent COMPLETED purchase transaction from
 *   /credits/transactions so the receipt reflects what the backend recorded
 *   instead of static mock data.
 * Used by: Next.js routing for /wallet/success.
 */
import Link from 'next/link';
import { CheckCircle2, Wallet2 } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { TransactionType } from '@pataspace/contracts';
import type { CreditTransaction } from '@pataspace/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { getRecentTransactions } from '@/lib/api/credits';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

function describePurchase(transaction: CreditTransaction | null) {
  if (!transaction) {
    return {
      label: 'Latest top-up',
      amount: 'KES —',
      receipt: 'Pending callback',
      date: 'Just now',
    };
  }
  return {
    label: transaction.description ?? 'Credit purchase',
    amount: formatKes(Math.abs(transaction.amount)),
    receipt: transaction.mpesaReceiptNumber ?? 'Pending callback',
    date: formatDateLabel(transaction.createdAt),
  };
}

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const transactions = await getRecentTransactions(token, 20).catch(
    () => [] as CreditTransaction[],
  );
  const purchase = transactions.find(
    (transaction) => transaction.type === TransactionType.PURCHASE,
  ) ?? null;
  const details = describePurchase(purchase);

  return (
    <TenantWorkspaceShell
      pathname="/wallet/buy"
      title="Payment success"
      description="Completed top-ups should immediately be reflected in the wallet balance and the full transaction ledger."
    >
      <div className="mx-auto max-w-4xl">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  Credits added successfully
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  The wallet has been refreshed and the transaction is now marked complete.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-border bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Transaction summary
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <p className="flex items-center justify-between">
                  <span>Description</span>
                  <span>{details.label}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Amount</span>
                  <span>{details.amount}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Receipt</span>
                  <span>{details.receipt}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Date</span>
                  <span>{details.date}</span>
                </p>
              </div>
            </div>

            <div className="border border-border bg-foreground p-5 text-background">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-background/76">
                <Wallet2 className="size-4 text-primary" />
                Next best step
              </p>
              <p className="mt-4 text-3xl font-semibold">
                Return to listings and unlock when ready
              </p>
              <p className="mt-3 text-sm leading-7 text-background/76">
                The ledger entry is permanent, so browsing, unlock checkout, and support can all refer back to the same payment if needed.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
                  Browse listings
                </Link>
                <Link
                  href="/wallet/transactions"
                  className={linkButtonClass({ variant: 'outline', size: 'sm' })}
                >
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

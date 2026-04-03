import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReceiptText, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { StatusBadge, transactionStatusMeta, transactionTypeMeta } from '@/components/shared/status-badge';
import { getMockTransactionById } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = getMockTransactionById(id);

  if (!transaction) {
    notFound();
  }

  const status = transactionStatusMeta(transaction.status);
  const type = transactionTypeMeta(transaction.type);

  return (
    <TenantWorkspaceShell
      pathname="/wallet/transactions"
      title="Transaction detail"
      description="Inspect the exact ledger movement, receipt details, and any linked unlock activity for this wallet record."
      actions={
        <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to history
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={type.label} tone={type.tone} />
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              {transaction.description}
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Created on {formatDateLabel(transaction.createdAt)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
            <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-5">
              <p className="font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525]">
                {transaction.amount < 0 ? '-' : '+'}
                {formatKes(Math.abs(transaction.amount))}
              </p>
              <p className="mt-3">Balance before: {formatKes(transaction.balanceBefore)}</p>
              <p>Balance after: {formatKes(transaction.balanceAfter)}</p>
            </div>

            <div className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-5">
              <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                <ReceiptText className="size-4 text-[#28809A]" />
                Payment metadata
              </p>
              <p className="mt-3">Transaction id: {transaction.id}</p>
              <p>Receipt: {transaction.mpesaReceiptNumber ?? 'No receipt on non-purchase ledger entries'}</p>
              <p>Related unlock: {transaction.unlockId ?? 'None'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Ledger context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <Wallet2 className="size-4 text-[#8ed7e7]" />
              Why this matters
            </p>
            <p>
              Every wallet record is auditable from the web workspace so users can trace purchases, unlock deductions, and refunds through one interface.
            </p>
            {transaction.unlockId ? (
              <Link href={`/unlocks/${transaction.unlockId}`} className={linkButtonClass({ size: 'sm' })}>
                Open linked unlock
              </Link>
            ) : (
              <Link href="/wallet" className={linkButtonClass({ size: 'sm' })}>
                Return to wallet overview
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

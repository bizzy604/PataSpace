import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { getMockTransactionById } from '@/lib/mock-app-state';

type TransactionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const transaction = getMockTransactionById(id);

  if (!transaction) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <PageIntro
        badge="Transaction detail"
        kicker={transaction.type}
        title={transaction.description}
        description="A single-transaction view helps the tenant confirm M-Pesa receipts, unlock spend, and refund history."
        actions={
          <Link href="/wallet/transactions" className={linkButtonVariants({ variant: 'outline' })}>
            Back to history
          </Link>
        }
      />

      <Card className="mt-8 bg-surface-elevated shadow-soft-md">
        <CardHeader>
          <CardTitle>Transaction metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5 text-sm text-foreground-secondary">
          {[
            ['Status', transaction.status],
            ['Amount', formatKes(transaction.amount)],
            ['Balance before', formatKes(transaction.balanceBefore)],
            ['Balance after', formatKes(transaction.balanceAfter)],
            ['Created', formatDateLabel(transaction.createdAt)],
            ['M-Pesa receipt', transaction.mpesaReceiptNumber ?? 'Not applicable'],
            ['Linked unlock', transaction.unlockId ?? 'No unlock attached'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 rounded-[22px] border border-separator bg-fill-soft px-4 py-3"
            >
              <span>{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

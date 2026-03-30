import { PageIntro } from '@/components/shared/page-intro';
import { TransactionCard } from '@/components/wallet/transaction-card';
import { mockTransactions } from '@/lib/mock-app-state';

export default function WalletTransactionsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Transactions"
        kicker="Wallet history"
        title="Every credit purchase, spend, and refund in one place."
        description="This page maps directly to the transaction history endpoint and gives the tenant a simple audit trail for credit movement."
      />

      <div className="mt-8 space-y-4">
        {mockTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </section>
  );
}

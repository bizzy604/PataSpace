import Link from "next/link";
import { ArrowUpRight, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatKes } from "@/lib/format";
import { linkButtonVariants } from "@/lib/link-button";
import { MockTransaction } from "@/lib/mock-app-state";
import { cn } from "@/lib/utils";

type TransactionCardProps = {
  transaction: MockTransaction;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const amountTone =
    transaction.amount >= 0 ? "text-[var(--hig-color-success)]" : "text-foreground";

  return (
    <Card size="sm" className="bg-surface-elevated">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-fill-soft text-foreground-secondary">
              <ReceiptText className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">{transaction.description}</CardTitle>
              <p className="mt-1 text-sm text-foreground-secondary">
                {formatDateLabel(transaction.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={transaction.status === "COMPLETED" ? "secondary" : "outline"}>
            {transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-5 text-sm text-foreground-secondary">
        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          <span>Amount</span>
          <span className={cn("font-semibold", amountTone)}>{formatKes(transaction.amount)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>
            Balance after <strong className="text-foreground">{formatKes(transaction.balanceAfter)}</strong>
          </span>
          <Link
            href={`/wallet/transactions/${transaction.id}`}
            className={linkButtonVariants({ variant: "ghost", size: "sm" })}
          >
            Details
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

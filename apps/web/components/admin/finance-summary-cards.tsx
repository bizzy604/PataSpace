/**
 * Purpose: The four payout summary tiles on the finance console — pending,
 *   failed, paid this month, paid year to date.
 * Why important: Keeps the money-at-a-glance presentation out of the panel
 *   orchestrator so each file stays small and single-purpose.
 * Used by: components/admin/finance-panel.tsx.
 */
'use client';

import type { AdminFinanceSummaryResponse } from '@pataspace/contracts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactKes } from '@/lib/format';

export function FinanceSummaryCards({
  summary,
  loading,
}: {
  summary: AdminFinanceSummaryResponse | null;
  loading: boolean;
}) {
  if (loading || !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      title: formatCompactKes(summary.pendingPayouts.amountKES),
      label: 'Pending payouts',
      detail: `${summary.pendingPayouts.count} in flight · ${summary.pendingPayouts.partners} partners`,
      accent: 'text-foreground',
    },
    {
      title: formatCompactKes(summary.failedPayouts.amountKES),
      label: 'Failed — needs retry',
      detail: `${summary.failedPayouts.count} dead-lettered`,
      accent: summary.failedPayouts.count > 0 ? 'text-destructive' : 'text-foreground',
    },
    {
      title: formatCompactKes(summary.paidThisMonth.amountKES),
      label: 'Paid this month',
      detail: `${summary.paidThisMonth.count} settlements`,
      accent: 'text-foreground',
    },
    {
      title: formatCompactKes(summary.paidYearToDate.amountKES),
      label: 'Paid year to date',
      detail: `${summary.paidYearToDate.count} settlements`,
      accent: 'text-foreground',
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="h-full border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className={`text-3xl font-semibold tracking-tight ${tile.accent}`}>
              {tile.title}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-foreground/80">
              {tile.label}
            </CardDescription>
            <CardDescription className="text-xs">{tile.detail}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

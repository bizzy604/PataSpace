/**
 * Purpose: The four payout summary tiles on the finance console — pending,
 *   failed, paid this month, paid year to date.
 * Why important: Keeps the money-at-a-glance presentation out of the panel
 *   orchestrator so each file stays small and single-purpose.
 * Used by: components/admin/finance-panel.tsx.
 */
'use client';

import type { AdminFinanceSummaryResponse } from '@pataspace/contracts';
import { AlertTriangle, BadgeCheck, CalendarCheck, Hourglass, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactKes } from '@/lib/format';
import { cn } from '@/lib/utils';

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

  const hasFailures = summary.failedPayouts.count > 0;

  const tiles: {
    title: string;
    label: string;
    detail: string;
    icon: LucideIcon;
    alert: boolean;
  }[] = [
    {
      title: formatCompactKes(summary.pendingPayouts.amountKES),
      label: 'Pending payouts',
      detail: `${summary.pendingPayouts.count} in flight · ${summary.pendingPayouts.partners} partners`,
      icon: Hourglass,
      alert: false,
    },
    {
      title: formatCompactKes(summary.failedPayouts.amountKES),
      label: 'Failed — needs retry',
      detail: `${summary.failedPayouts.count} dead-lettered`,
      icon: AlertTriangle,
      alert: hasFailures,
    },
    {
      title: formatCompactKes(summary.paidThisMonth.amountKES),
      label: 'Paid this month',
      detail: `${summary.paidThisMonth.count} settlements`,
      icon: CalendarCheck,
      alert: false,
    },
    {
      title: formatCompactKes(summary.paidYearToDate.amountKES),
      label: 'Paid year to date',
      detail: `${summary.paidYearToDate.count} settlements`,
      icon: BadgeCheck,
      alert: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className={cn(
              'rounded-xl border bg-card p-4',
              tile.alert ? 'border-destructive/30' : 'border-border',
            )}
          >
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                tile.alert
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
            </div>
            <p
              className={cn(
                'mt-3 text-2xl font-semibold tracking-tight tabular-nums',
                tile.alert ? 'text-destructive' : 'text-foreground',
              )}
            >
              {tile.title}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground/85">{tile.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tile.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

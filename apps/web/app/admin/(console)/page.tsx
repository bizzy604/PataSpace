/**
 * Purpose: Admin dashboard — marketplace-wide counts from GET /admin/metrics.
 * Why important: The operator's first screen: moderation backlog, dispute
 *   load, user growth, and commission money in flight at a glance.
 * Used by: /admin route (inside AdminShell).
 */
'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Home,
  KeyRound,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNotice, AdminPageHeader } from '@/components/admin/admin-chrome';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchAdminMetrics } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';
import { cn } from '@/lib/utils';

type Tile = {
  value: string;
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  /** Highlights a tile that represents work waiting on the operator. */
  attention?: boolean;
};

function MetricTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tile.href}
      className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            tile.attention ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-5">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {tile.value}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground/85">{tile.label}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{tile.detail}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchAdminMetrics(getToken),
    [],
  );
  const { data, loading, error, reload } = useAdminData(fetcher);

  if (loading) {
    return (
      <div className="space-y-5">
        <AdminPageHeader eyebrow="Marketplace control" title="Operations dashboard" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <AdminPageHeader eyebrow="Marketplace control" title="Operations dashboard" />
        <AdminNotice
          message={error ?? 'Metrics unavailable — no data returned.'}
          onRetry={() => void reload()}
        />
      </div>
    );
  }

  const disputesNeedingAttention = data.disputes.open + data.disputes.investigating;

  const tiles: Tile[] = [
    {
      value: `${data.listings.pending}`,
      label: 'Listings awaiting review',
      detail: `${data.listings.active} live · ${data.listings.rejected} rejected · ${data.listings.total} total`,
      href: '/admin/listings',
      icon: Home,
      attention: data.listings.pending > 0,
    },
    {
      value: `${disputesNeedingAttention}`,
      label: 'Disputes needing attention',
      detail: `${data.disputes.open} open · ${data.disputes.investigating} investigating`,
      href: '/admin/disputes',
      icon: ShieldAlert,
      attention: disputesNeedingAttention > 0,
    },
    {
      value: `${data.users.total}`,
      label: 'Registered users',
      detail: `${data.users.newLast7Days} new this week · ${data.users.banned} banned`,
      href: '/admin/users',
      icon: Users,
    },
    {
      value: `${data.unlocks.total}`,
      label: 'Contact unlocks',
      detail: `${data.unlocks.last7Days} in the last 7 days`,
      href: '/admin/listings',
      icon: KeyRound,
    },
    {
      value: formatKes(data.commissions.pendingAmountKES),
      label: 'Commission pending payout',
      detail: `${data.commissions.pendingCount} commissions in the hold window`,
      href: '/admin/disputes',
      icon: Wallet,
      attention: data.commissions.pendingCount > 0,
    },
    {
      value: formatKes(data.commissions.paidAmountKES),
      label: 'Commission paid to date',
      detail: `${data.commissions.paidCount} payouts · ${data.supportTickets.open} open support tickets`,
      href: '/admin/users',
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Marketplace control"
        title="Operations dashboard"
        description="Moderation backlog, dispute load, user growth, and commission money in flight."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <MetricTile key={tile.label} tile={tile} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Generated {new Date(data.generatedAt).toLocaleString('en-KE')}. Refresh the page for
        current numbers.
      </p>
    </div>
  );
}

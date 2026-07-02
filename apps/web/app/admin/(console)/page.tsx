/**
 * Purpose: Admin dashboard — marketplace-wide counts from GET /admin/metrics.
 * Why important: The operator's first screen: moderation backlog, dispute
 *   load, user growth, and commission money in flight at a glance.
 * Used by: /admin route (inside AdminShell).
 */
'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchAdminMetrics } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

export default function AdminDashboardPage() {
  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchAdminMetrics(getToken),
    [],
  );
  const { data, loading, error } = useAdminData(fetcher);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg">Metrics unavailable</CardTitle>
          <CardDescription>{error ?? 'No data returned.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tiles = [
    {
      title: `${data.listings.pending}`,
      label: 'Listings awaiting review',
      detail: `${data.listings.active} live · ${data.listings.rejected} rejected · ${data.listings.total} total`,
      href: '/admin/listings',
    },
    {
      title: `${data.disputes.open + data.disputes.investigating}`,
      label: 'Disputes needing attention',
      detail: `${data.disputes.open} open · ${data.disputes.investigating} investigating`,
      href: '/admin/disputes',
    },
    {
      title: `${data.users.total}`,
      label: 'Registered users',
      detail: `${data.users.newLast7Days} new this week · ${data.users.banned} banned`,
      href: '/admin/users',
    },
    {
      title: `${data.unlocks.total}`,
      label: 'Contact unlocks',
      detail: `${data.unlocks.last7Days} in the last 7 days`,
      href: '/admin/listings',
    },
    {
      title: formatKes(data.commissions.pendingAmountKES),
      label: 'Commission pending payout',
      detail: `${data.commissions.pendingCount} commissions in the hold window`,
      href: '/admin/disputes',
    },
    {
      title: formatKes(data.commissions.paidAmountKES),
      label: 'Commission paid to date',
      detail: `${data.commissions.paidCount} payouts · ${data.supportTickets.open} open support tickets`,
      href: '/admin/users',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Marketplace control
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Operations dashboard
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="group">
            <Card className="h-full border border-border bg-card shadow-sm transition group-hover:border-primary/40 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-4xl font-semibold tracking-tight text-foreground">
                  {tile.title}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-foreground/80">
                  {tile.label}
                </CardDescription>
                <CardDescription className="text-xs">{tile.detail}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Generated {new Date(data.generatedAt).toLocaleString('en-KE')}. Refresh the page for
        current numbers.
      </p>
    </div>
  );
}

/**
 * Purpose: Admin dispute queue — status filter plus the investigate, resolve
 *   (with or without refund), and close actions.
 * Why important: Disputes gate refunds and block commissions; this panel is
 *   where those decisions get made and recorded.
 * Used by: app/admin/disputes/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminDisputeSummary } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { useAdminData } from '@/components/admin/use-admin-data';
import {
  closeDispute,
  fetchAdminDisputes,
  investigateDispute,
  resolveDispute,
} from '@/lib/api/admin';

const STATUSES = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;

const statusTone: Record<string, StatusTone> = {
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  RESOLVED: 'positive',
  CLOSED: 'neutral',
};

export function DisputesPanel() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchAdminDisputes(getToken, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    [statusFilter],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const run = async (disputeId: string, action: () => Promise<unknown>) => {
    setActionError(null);
    setActioningId(disputeId);
    try {
      await action();
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Action failed');
    } finally {
      setActioningId(null);
    }
  };

  const resolve = (dispute: AdminDisputeSummary, refund: boolean) => {
    const resolution = window.prompt(
      refund
        ? 'Resolution note (required) — the unlock will be refunded in full:'
        : 'Resolution note (required) — no refund will be issued:',
    );
    if (!resolution || resolution.trim().length < 10) {
      setActionError('A resolution note of at least 10 characters is required.');
      return;
    }
    void run(dispute.id, () =>
      resolveDispute(getToken, dispute.id, {
        resolution: resolution.trim(),
        action: refund ? 'FULL_REFUND' : 'NO_REFUND',
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Disputes
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Dispute queue
        </h1>
      </div>

      <div className="flex gap-1">
        {STATUSES.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'ALL' ? 'All' : status.toLowerCase()}
          </Button>
        ))}
      </div>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (data?.data ?? []).length === 0 ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">No disputes here</CardTitle>
            <CardDescription>Nothing matches the current filter.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {(data?.data ?? []).map((dispute) => (
            <Card key={dispute.id} className="border border-border bg-card">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    label={dispute.status}
                    tone={statusTone[dispute.status] ?? 'neutral'}
                  />
                  <CardTitle className="text-lg">
                    {dispute.listing.neighborhood}, {dispute.listing.county}
                  </CardTitle>
                </div>
                <CardDescription>
                  Reported by {dispute.reportedBy.firstName} {dispute.reportedBy.lastName} on{' '}
                  {new Date(dispute.createdAt).toLocaleDateString('en-KE')} ·{' '}
                  {dispute.evidenceCount} evidence items · unlock {dispute.unlockId}
                </CardDescription>
                {dispute.evidenceCount > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                      Evidence attached
                    </span>
                    {dispute.evidence.map((item) => (
                      <a
                        key={item}
                        href={item}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      >
                        Open attachment
                      </a>
                    ))}
                  </div>
                ) : null}
                <CardDescription className="text-sm text-foreground/80">
                  “{dispute.reason}”
                </CardDescription>
                {dispute.resolution ? (
                  <CardDescription>Resolution: {dispute.resolution}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {dispute.status === 'OPEN' ? (
                  <Button
                    size="sm"
                    disabled={actioningId === dispute.id}
                    onClick={() =>
                      void run(dispute.id, () => investigateDispute(getToken, dispute.id))
                    }
                  >
                    Start investigating
                  </Button>
                ) : null}
                {dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningId === dispute.id}
                      onClick={() => resolve(dispute, true)}
                    >
                      Resolve with refund
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningId === dispute.id}
                      onClick={() => resolve(dispute, false)}
                    >
                      Resolve, no refund
                    </Button>
                  </>
                ) : null}
                {dispute.status === 'RESOLVED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actioningId === dispute.id}
                    onClick={() => void run(dispute.id, () => closeDispute(getToken, dispute.id))}
                  >
                    Close dispute
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{data ? `${data.meta.total} disputes` : ''}</p>
    </div>
  );
}

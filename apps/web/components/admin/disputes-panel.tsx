/**
 * Purpose: Admin dispute queue — status filter plus the investigate, resolve
 *   (with or without refund), and close actions.
 * Why important: Disputes gate refunds and block commissions; this panel is
 *   where those decisions get made and recorded.
 * Used by: app/admin/disputes/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminDisputeSummary } from '@pataspace/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { Paperclip, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import {
  AdminFilterTabs,
  AdminNotice,
  AdminPageHeader,
  AdminToolbar,
} from '@/components/admin/admin-chrome';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { useAdminData } from '@/components/admin/use-admin-data';
import {
  closeDispute,
  fetchAdminDisputes,
  investigateDispute,
  resolveDispute,
} from '@/lib/api/admin';

const STATUSES = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

type StatusFilter = (typeof STATUSES)[number]['value'];

const statusTone: Record<string, StatusTone> = {
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  RESOLVED: 'positive',
  CLOSED: 'neutral',
};

type ResolveTarget = { dispute: AdminDisputeSummary; refund: boolean };

export function DisputesPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ResolveTarget | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchAdminDisputes(getToken, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    [statusFilter],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const run = useCallback(
    async (disputeId: string, action: () => Promise<unknown>) => {
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
    },
    [reload],
  );

  const confirmResolve = useCallback(
    (resolution: string) => {
      if (!resolveTarget) return;
      const { dispute, refund } = resolveTarget;
      setResolveTarget(null);
      void run(dispute.id, () =>
        resolveDispute(getToken, dispute.id, {
          resolution: resolution.trim(),
          action: refund ? 'FULL_REFUND' : 'NO_REFUND',
        }),
      );
    },
    [getToken, resolveTarget, run],
  );

  const columns = useMemo<ColumnDef<AdminDisputeSummary, unknown>[]>(
    () => [
      {
        id: 'status',
        accessorFn: (row) => row.status,
        meta: { className: 'align-top' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.status}
            tone={statusTone[row.original.status] ?? 'neutral'}
          />
        ),
      },
      {
        id: 'listing',
        accessorFn: (row) => `${row.listing.neighborhood} ${row.listing.county}`,
        meta: { className: 'align-top' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Listing" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">
              {row.original.listing.neighborhood}, {row.original.listing.county}
            </div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              unlock {row.original.unlockId}
            </div>
          </div>
        ),
      },
      {
        id: 'reportedBy',
        accessorFn: (row) => `${row.reportedBy.firstName} ${row.reportedBy.lastName}`,
        meta: { className: 'align-top' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reported by" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-foreground">
              {row.original.reportedBy.firstName} {row.original.reportedBy.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleDateString('en-KE')}
            </div>
          </div>
        ),
      },
      {
        id: 'reason',
        accessorFn: (row) => row.reason,
        enableSorting: false,
        meta: { className: 'align-top' },
        header: () => <span className="block">Claim</span>,
        cell: ({ row }) => (
          <div className="max-w-sm space-y-1.5">
            <p className="text-sm text-foreground/85" title={row.original.reason}>
              “{row.original.reason}”
            </p>
            {row.original.resolution ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">Resolution:</span>{' '}
                {row.original.resolution}
              </p>
            ) : null}
            {row.original.evidenceCount > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {row.original.evidence.map((item, index) => (
                  <a
                    key={item}
                    href={item}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15"
                  >
                    <Paperclip className="size-3" />
                    Evidence {index + 1}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No evidence attached</p>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        meta: { align: 'right', className: 'align-top' },
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => {
          const dispute = row.original;
          const busy = actioningId === dispute.id;
          return (
            <div className="flex flex-col items-end gap-1.5">
              {dispute.status === 'OPEN' ? (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void run(dispute.id, () => investigateDispute(getToken, dispute.id))}
                >
                  Start investigating
                </Button>
              ) : null}
              {dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setResolveTarget({ dispute, refund: true })}
                  >
                    Resolve with refund
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setResolveTarget({ dispute, refund: false })}
                  >
                    Resolve, no refund
                  </Button>
                </>
              ) : null}
              {dispute.status === 'RESOLVED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void run(dispute.id, () => closeDispute(getToken, dispute.id))}
                >
                  Close dispute
                </Button>
              ) : null}
              {dispute.status === 'CLOSED' ? (
                <span className="text-xs text-muted-foreground">Closed</span>
              ) : null}
            </div>
          );
        },
      },
    ],
    [actioningId, getToken, run],
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Disputes"
        title="Dispute queue"
        description="Disputes gate refunds and hold commissions. Resolving one records the decision and the note against the unlock."
      />

      <AdminToolbar>
        <AdminFilterTabs
          label="Filter by dispute status"
          options={STATUSES}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </AdminToolbar>

      {actionError ? <AdminNotice message={actionError} /> : null}
      {error ? <AdminNotice message={error} onRetry={() => void reload()} /> : null}

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={loading}
        getRowId={(row) => row.id}
        emptyIcon={<ShieldAlert className="size-5" />}
        emptyTitle="No disputes here"
        emptyDescription="Nothing matches the current filter."
        summary={data ? `${data.meta.total} disputes` : null}
      />

      <ReasonDialog
        open={resolveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResolveTarget(null);
        }}
        title={
          resolveTarget
            ? resolveTarget.refund
              ? 'Resolve with a full refund'
              : 'Resolve without a refund'
            : 'Resolve dispute'
        }
        description={
          resolveTarget?.refund
            ? 'The unlock will be refunded in full. The note is kept on record against the dispute.'
            : 'No refund will be issued. The note is kept on record against the dispute.'
        }
        placeholder="Resolution note (required)"
        submitLabel={resolveTarget?.refund ? 'Refund and resolve' : 'Resolve, no refund'}
        minLength={10}
        onSubmit={confirmResolve}
      />
    </div>
  );
}

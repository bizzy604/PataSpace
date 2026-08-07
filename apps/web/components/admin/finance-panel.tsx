/**
 * Purpose: Admin finance console — payout summary tiles plus the commission
 *   payout ledger with status filter, search, pagination, and the retry action
 *   for failed payouts.
 * Why important: This is where an operator sees money owed and requeues a
 *   dead-lettered B2C payout; the retry reports the live outcome.
 * Used by: app/admin/finance/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminPayoutRecord } from '@pataspace/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { FinanceSummaryCards } from '@/components/admin/finance-summary-cards';
import {
  AdminFilterTabs,
  AdminNotice,
  AdminPageHeader,
  AdminSearchField,
  AdminToolbar,
} from '@/components/admin/admin-chrome';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchFinanceSummary, fetchPayoutLedger, retryPayout } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

const STATUSES = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DUE', label: 'Due' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
] as const;

type StatusFilter = (typeof STATUSES)[number]['value'];

const statusTone: Record<string, StatusTone> = {
  PENDING: 'warning',
  DUE: 'warning',
  PROCESSING: 'brand',
  PAID: 'positive',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

export function FinancePanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const summaryFetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchFinanceSummary(getToken),
    [],
  );
  const ledgerFetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchPayoutLedger(getToken, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
      }),
    [statusFilter, search],
  );

  const summary = useAdminData(summaryFetcher);
  const ledger = useAdminData(ledgerFetcher);

  const { getToken: ledgerGetToken, reload: reloadLedger } = ledger;
  const { reload: reloadSummary } = summary;

  const runRetry = useCallback(
    async (payout: AdminPayoutRecord) => {
      setActionNote(null);
      setActioningId(payout.id);
      try {
        const result = await retryPayout(ledgerGetToken, payout.id);
        setActionNote(`Payout ${payout.id}: ${result.outcome} (now ${result.status}).`);
        await Promise.all([reloadLedger(), reloadSummary()]);
      } catch (caught) {
        setActionNote(caught instanceof Error ? caught.message : 'Retry failed');
      } finally {
        setActioningId(null);
      }
    },
    [ledgerGetToken, reloadLedger, reloadSummary],
  );

  const columns = useMemo<ColumnDef<AdminPayoutRecord, unknown>[]>(
    () => [
      {
        id: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transaction" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
        ),
      },
      {
        id: 'payee',
        accessorFn: (row) => `${row.payee.firstName} ${row.payee.lastName}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Partner / Property" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">
              {row.original.payee.firstName} {row.original.payee.lastName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.listing.neighborhood}, {row.original.listing.county}
            </div>
          </div>
        ),
      },
      {
        id: 'amountKES',
        accessorFn: (row) => row.amountKES,
        meta: { align: 'right' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-foreground">
            {formatKes(row.original.amountKES)}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge
              label={row.original.status}
              tone={statusTone[row.original.status] ?? 'neutral'}
            />
            {row.original.lastAttemptError ? (
              <div
                className="max-w-[16rem] truncate text-xs text-destructive"
                title={row.original.lastAttemptError}
              >
                {row.original.lastAttemptError}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'mpesaReceiptNumber',
        accessorFn: (row) => row.mpesaReceiptNumber ?? '',
        header: ({ column }) => <DataTableColumnHeader column={column} title="M-Pesa Ref" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.mpesaReceiptNumber ?? '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        meta: { align: 'right' },
        header: () => <span className="block text-right">Action</span>,
        cell: ({ row }) =>
          row.original.status === 'FAILED' ? (
            <Button
              size="sm"
              disabled={actioningId === row.original.id}
              onClick={() => void runRetry(row.original)}
            >
              {actioningId === row.original.id ? 'Retrying…' : 'Retry'}
            </Button>
          ) : null,
      },
    ],
    [actioningId, runRetry],
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Financial reconciliation"
        title="Payouts &amp; commissions"
        description="Money owed to partners and the state of every B2C disbursement. Failed payouts can be requeued here."
      />

      <FinanceSummaryCards summary={summary.data} loading={summary.loading} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Payout ledger</h2>
          <AdminSearchField
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => setSearch(searchInput.trim())}
            onClear={() => {
              setSearchInput('');
              setSearch('');
            }}
            applied={search}
            placeholder="Search ID, M-Pesa ref, neighborhood"
          />
        </div>

        <AdminToolbar>
          <AdminFilterTabs
            label="Filter by payout status"
            options={STATUSES}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </AdminToolbar>

        {actionNote ? <AdminNotice message={actionNote} tone="info" /> : null}
        {ledger.error ? (
          <AdminNotice message={ledger.error} onRetry={() => void reloadLedger()} />
        ) : null}

        <DataTable
          columns={columns}
          data={ledger.data?.data}
          isLoading={ledger.loading}
          getRowId={(row) => row.id}
          emptyIcon={<Banknote className="size-5" />}
          emptyTitle="No payouts match this filter"
          emptyDescription="Adjust the status filter or search term to widen the ledger."
          summary={ledger.data ? `${ledger.data.meta.total} payouts` : null}
        />
      </div>
    </div>
  );
}

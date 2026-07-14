/**
 * Purpose: Admin finance console — payout summary tiles plus the commission
 *   payout ledger with status filter, search, pagination, and the retry action
 *   for failed payouts.
 * Why important: This is where an operator sees money owed and requeues a
 *   dead-lettered B2C payout; the retry reports the live outcome.
 * Used by: app/admin/finance/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminPayoutRecord } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { FinanceSummaryCards } from '@/components/admin/finance-summary-cards';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchFinanceSummary, fetchPayoutLedger, retryPayout } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

const STATUSES = ['ALL', 'PENDING', 'DUE', 'PROCESSING', 'PAID', 'FAILED'] as const;

const statusTone: Record<string, StatusTone> = {
  PENDING: 'warning',
  DUE: 'warning',
  PROCESSING: 'brand',
  PAID: 'positive',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

export function FinancePanel() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('ALL');
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

  const runRetry = async (payout: AdminPayoutRecord) => {
    setActionNote(null);
    setActioningId(payout.id);
    try {
      const result = await retryPayout(ledger.getToken, payout.id);
      setActionNote(`Payout ${payout.id}: ${result.outcome} (now ${result.status}).`);
      await Promise.all([ledger.reload(), summary.reload()]);
    } catch (caught) {
      setActionNote(caught instanceof Error ? caught.message : 'Retry failed');
    } finally {
      setActioningId(null);
    }
  };

  const rows = ledger.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Financial reconciliation
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Payouts &amp; commissions
        </h1>
      </div>

      <FinanceSummaryCards summary={summary.data} loading={summary.loading} />

      <Card className="border border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">Payout ledger</CardTitle>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
              }}
              className="flex gap-2"
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search ID, M-Pesa ref, neighborhood"
                className="w-64"
              />
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap gap-1">
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
        </CardHeader>
        <CardContent className="space-y-4">
          {actionNote ? <p className="text-sm text-foreground/80">{actionNote}</p> : null}
          {ledger.error ? <p className="text-sm text-destructive">{ledger.error}</p> : null}
          {ledger.loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Partner / Property</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>M-Pesa Ref</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs">{payout.id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {payout.payee.firstName} {payout.payee.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payout.listing.neighborhood}, {payout.listing.county}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatKes(payout.amountKES)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={payout.status}
                          tone={statusTone[payout.status] ?? 'neutral'}
                        />
                        {payout.lastAttemptError ? (
                          <div className="mt-1 max-w-[16rem] truncate text-xs text-destructive">
                            {payout.lastAttemptError}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.mpesaReceiptNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {payout.status === 'FAILED' ? (
                          <Button
                            size="sm"
                            disabled={actioningId === payout.id}
                            onClick={() => void runRetry(payout)}
                          >
                            {actioningId === payout.id ? 'Retrying…' : 'Retry'}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {ledger.data ? `${ledger.data.meta.total} payouts` : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

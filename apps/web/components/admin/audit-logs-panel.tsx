/**
 * Purpose: Admin audit-log console — filter bar, a before → after payload diff
 *   table, and a CSV export over the current filters.
 * Why important: This is the security review surface; every admin mutation
 *   (bans, approvals, resolutions, config, payouts) lands here for inspection.
 * Used by: app/admin/audit-logs/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminAuditLogRecord } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
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
import { useAdminData } from '@/components/admin/use-admin-data';
import { exportAuditLogsCsv, fetchAuditLogs } from '@/lib/api/admin';

type Filters = { action: string; entityType: string; entityId: string; from: string; to: string };

const EMPTY: Filters = { action: '', entityType: '', entityId: '', from: '', to: '' };

function cleaned(filters: Filters) {
  return {
    action: filters.action.trim() || undefined,
    entityType: filters.entityType.trim() || undefined,
    entityId: filters.entityId.trim() || undefined,
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
  };
}

function payloadText(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function AuditLogsPanel() {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [exporting, setExporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchAuditLogs(getToken, cleaned(applied)),
    [applied],
  );
  const { data, loading, error, getToken } = useAdminData(fetcher);

  const runExport = async () => {
    setNote(null);
    setExporting(true);
    try {
      const csv = await exportAuditLogsCsv(getToken, cleaned(applied));
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Security
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Audit logs</h1>
        </div>
        <Button variant="outline" disabled={exporting} onClick={() => void runExport()}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <form
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(draft);
        }}
      >
        <Input
          placeholder="Action (e.g. user.ban)"
          value={draft.action}
          onChange={(e) => setDraft({ ...draft, action: e.target.value })}
        />
        <Input
          placeholder="Entity type"
          value={draft.entityType}
          onChange={(e) => setDraft({ ...draft, entityType: e.target.value })}
        />
        <Input
          placeholder="Entity ID"
          value={draft.entityId}
          onChange={(e) => setDraft({ ...draft, entityId: e.target.value })}
        />
        <Input
          type="date"
          value={draft.from}
          onChange={(e) => setDraft({ ...draft, from: e.target.value })}
        />
        <Input
          type="date"
          value={draft.to}
          onChange={(e) => setDraft({ ...draft, to: e.target.value })}
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(EMPTY);
              setApplied(EMPTY);
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {note ? <p className="text-sm text-destructive">{note}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No audit entries match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp / IP</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action / Target</TableHead>
                <TableHead>Before → After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry: AdminAuditLogRecord) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap align-top text-xs">
                    <div>{new Date(entry.createdAt).toLocaleString('en-KE')}</div>
                    <div className="text-muted-foreground">{entry.ipAddress ?? 'no ip'}</div>
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {entry.admin
                      ? `${entry.admin.firstName} ${entry.admin.lastName}`
                      : 'System'}
                  </TableCell>
                  <TableCell className="align-top text-xs">
                    <div className="font-mono font-medium text-foreground">{entry.action}</div>
                    <div className="text-muted-foreground">
                      {entry.entityType} · {entry.entityId}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="max-w-md space-y-1 font-mono text-[11px]">
                      <div className="truncate text-destructive" title={payloadText(entry.oldValue)}>
                        − {payloadText(entry.oldValue)}
                      </div>
                      <div
                        className="truncate text-emerald-600 dark:text-emerald-400"
                        title={payloadText(entry.newValue)}
                      >
                        + {payloadText(entry.newValue)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {data ? `${data.meta.total} entries · page ${data.meta.page} of ${data.meta.totalPages}` : ''}
      </p>
    </div>
  );
}

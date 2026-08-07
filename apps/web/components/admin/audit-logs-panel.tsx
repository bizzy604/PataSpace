/**
 * Purpose: Admin audit-log console — filter bar, a before → after payload diff
 *   table, and a CSV export over the current filters.
 * Why important: This is the security review surface; every admin mutation
 *   (bans, approvals, resolutions, config, payouts) lands here for inspection.
 * Used by: app/admin/audit-logs/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminAuditLogRecord } from '@pataspace/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { AdminNotice, AdminPageHeader } from '@/components/admin/admin-chrome';
import { useAdminData } from '@/components/admin/use-admin-data';
import { exportAuditLogsCsv, fetchAuditLogs } from '@/lib/api/admin';

type Filters = { action: string; entityType: string; entityId: string; from: string; to: string };

const EMPTY: Filters = { action: '', entityType: '', entityId: '', from: '', to: '' };

const FIELDS = [
  { key: 'action', label: 'Action', placeholder: 'e.g. user.ban', type: 'text' },
  { key: 'entityType', label: 'Entity type', placeholder: 'e.g. Listing', type: 'text' },
  { key: 'entityId', label: 'Entity ID', placeholder: 'Exact ID', type: 'text' },
  { key: 'from', label: 'From', placeholder: '', type: 'date' },
  { key: 'to', label: 'To', placeholder: '', type: 'date' },
] as const satisfies readonly {
  key: keyof Filters;
  label: string;
  placeholder: string;
  type: string;
}[];

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

function isActive(filters: Filters) {
  return Object.values(filters).some((value) => value !== '');
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
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

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

  const columns = useMemo<ColumnDef<AdminAuditLogRecord, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        accessorFn: (row) => row.createdAt,
        meta: { className: 'align-top whitespace-nowrap' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="text-foreground">
              {new Date(row.original.createdAt).toLocaleString('en-KE')}
            </div>
            <div className="font-mono text-muted-foreground">
              {row.original.ipAddress ?? 'no ip'}
            </div>
          </div>
        ),
      },
      {
        id: 'admin',
        accessorFn: (row) =>
          row.admin ? `${row.admin.firstName} ${row.admin.lastName}` : 'System',
        meta: { className: 'align-top' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.admin
              ? `${row.original.admin.firstName} ${row.original.admin.lastName}`
              : 'System'}
          </span>
        ),
      },
      {
        id: 'action',
        accessorFn: (row) => row.action,
        meta: { className: 'align-top' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Action / Target" />,
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-mono font-medium text-foreground">{row.original.action}</div>
            <div className="text-muted-foreground">
              {row.original.entityType} · {row.original.entityId}
            </div>
          </div>
        ),
      },
      {
        id: 'diff',
        enableSorting: false,
        meta: { className: 'align-top' },
        header: () => <span className="block">Before → After</span>,
        cell: ({ row }) => (
          <div className="max-w-md space-y-1 font-mono text-[11px]">
            <div className="truncate text-destructive" title={payloadText(row.original.oldValue)}>
              − {payloadText(row.original.oldValue)}
            </div>
            <div
              className="truncate text-emerald-600 dark:text-emerald-400"
              title={payloadText(row.original.newValue)}
            >
              + {payloadText(row.original.newValue)}
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const appliedActive = isActive(applied);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Security"
        title="Audit logs"
        description="Every admin mutation, who made it, from which address, and exactly what changed."
        actions={
          <Button variant="outline" disabled={exporting} onClick={() => void runExport()}>
            <Download />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      <form
        className="rounded-xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(draft);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </span>
              <Input
                type={field.type}
                placeholder={field.placeholder || undefined}
                value={draft[field.key]}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((prev) => {
                    const next = { ...prev };
                    next[field.key] = value;
                    return next;
                  });
                }}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!appliedActive && !isActive(draft)}
            onClick={() => {
              setDraft(EMPTY);
              setApplied(EMPTY);
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      {note ? <AdminNotice message={note} /> : null}
      {error ? <AdminNotice message={error} onRetry={() => void reload()} /> : null}

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={loading}
        getRowId={(row) => row.id}
        emptyIcon={<ScrollText className="size-5" />}
        emptyTitle="No audit entries"
        emptyDescription={
          appliedActive
            ? 'Nothing matches these filters. Widen the date range or clear a field.'
            : 'Admin actions will appear here as they happen.'
        }
        summary={
          data
            ? `${data.meta.total} entries · page ${data.meta.page} of ${data.meta.totalPages}`
            : null
        }
      />
    </div>
  );
}

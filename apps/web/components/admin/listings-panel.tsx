/**
 * Purpose: Admin listings workspace — moderation queue tab plus the full
 *   catalogue with status filter, search, edit, and soft delete.
 * Why important: This is the CRUD surface for live marketplace inventory.
 * Used by: app/admin/listings/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminListingSummary, AdminUpdateListingRequest } from '@pataspace/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { ListingEditSheet } from '@/components/admin/listing-edit-sheet';
import { ModerationQueue } from '@/components/admin/moderation-queue';
import {
  AdminNotice,
  AdminPageHeader,
  AdminSearchField,
  AdminToolbar,
} from '@/components/admin/admin-chrome';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { useAdminData } from '@/components/admin/use-admin-data';
import { deleteAdminListing, fetchAdminListings, updateAdminListing } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

const statusTone: Record<string, StatusTone> = {
  PENDING: 'warning',
  ACTIVE: 'positive',
  UNLOCKED: 'brand',
  CONFIRMED: 'brand',
  COMPLETED: 'neutral',
  REJECTED: 'danger',
  DELETED: 'danger',
};

export function ListingsPanel() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [editing, setEditing] = useState<AdminListingSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminListingSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchAdminListings(getToken, {
        search: submittedSearch || undefined,
        includeDeleted: 'true',
      }),
    [submittedSearch],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const saveEdit = async (listingId: string, input: AdminUpdateListingRequest) => {
    await updateAdminListing(getToken, listingId, input);
    setEditing(null);
    await reload();
  };

  const confirmDelete = useCallback(
    async (reason: string) => {
      if (!deleteTarget) return;
      setActionError(null);
      try {
        await deleteAdminListing(getToken, deleteTarget.id, reason.trim() || undefined);
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Delete failed');
      } finally {
        setDeleteTarget(null);
      }
    },
    [deleteTarget, getToken, reload],
  );

  const columns = useMemo<ColumnDef<AdminListingSummary, unknown>[]>(
    () => [
      {
        id: 'listing',
        accessorFn: (row) => row.neighborhood,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Listing" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{row.original.neighborhood}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.county} · {row.original.houseType.replaceAll('_', ' ').toLowerCase()}
            </div>
          </div>
        ),
      },
      {
        id: 'owner',
        accessorFn: (row) => `${row.owner.firstName} ${row.owner.lastName}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.owner.firstName} {row.original.owner.lastName}
          </span>
        ),
      },
      {
        id: 'monthlyRent',
        accessorFn: (row) => row.monthlyRent,
        meta: { align: 'right' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rent" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-foreground">
            {formatKes(row.original.monthlyRent)}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => (row.isDeleted ? 'DELETED' : row.status),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const label = row.original.isDeleted ? 'DELETED' : row.original.status;
          return <StatusBadge label={label} tone={statusTone[label] ?? 'neutral'} />;
        },
      },
      {
        id: 'unlockCount',
        accessorFn: (row) => row.unlockCount,
        meta: { align: 'right' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Unlocks" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">{row.original.unlockCount}</span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        meta: { align: 'right' },
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={row.original.isDeleted}
              onClick={() => setEditing(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={row.original.isDeleted}
              onClick={() => setDeleteTarget(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Listings"
        title="Moderation and catalogue"
        description="Review pending submissions against their uploaded media, then manage the live catalogue."
      />

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Moderation queue</TabsTrigger>
          <TabsTrigger value="catalogue">Full catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="pt-4">
          <ModerationQueue />
        </TabsContent>

        <TabsContent value="catalogue" className="space-y-4 pt-4">
          <AdminToolbar>
            <AdminSearchField
              value={search}
              onChange={setSearch}
              onSubmit={() => setSubmittedSearch(search.trim())}
              onClear={() => {
                setSearch('');
                setSubmittedSearch('');
              }}
              applied={submittedSearch}
              placeholder="Search county or neighborhood"
            />
          </AdminToolbar>

          {actionError ? <AdminNotice message={actionError} /> : null}
          {error ? <AdminNotice message={error} onRetry={() => void reload()} /> : null}

          <DataTable
            columns={columns}
            data={data?.data}
            isLoading={loading}
            getRowId={(row) => row.id}
            emptyIcon={<Home className="size-5" />}
            emptyTitle="No listings found"
            emptyDescription={
              submittedSearch
                ? `Nothing matches “${submittedSearch}”.`
                : 'The catalogue is empty.'
            }
            summary={data ? `${data.meta.total} listings` : null}
          />
        </TabsContent>
      </Tabs>

      <ListingEditSheet listing={editing} onClose={() => setEditing(null)} onSave={saveEdit} />

      <ReasonDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Soft-delete the ${deleteTarget.neighborhood} listing?` : 'Delete listing'}
        description="The listing is hidden from the marketplace but kept on record. A reason is optional."
        placeholder="Reason (optional)"
        submitLabel="Delete listing"
        minLength={0}
        destructive
        onSubmit={(reason) => void confirmDelete(reason)}
      />
    </div>
  );
}

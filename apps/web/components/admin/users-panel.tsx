/**
 * Purpose: Admin user directory — search, banned filter, and ban/unban with a
 *   required reason.
 * Why important: The console's account-moderation surface; bans revoke
 *   sessions via the API and lock the user out of both apps.
 * Used by: app/admin/users/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminUserSummary } from '@pataspace/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  AdminFilterTabs,
  AdminNotice,
  AdminPageHeader,
  AdminSearchField,
  AdminToolbar,
} from '@/components/admin/admin-chrome';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { useAdminData } from '@/components/admin/use-admin-data';
import { banUser, fetchAdminUsers, unbanUser } from '@/lib/api/admin';

type BannedFilter = 'all' | 'true' | 'false';

const BANNED_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'false', label: 'Active' },
  { value: 'true', label: 'Banned' },
] as const satisfies readonly { value: BannedFilter; label: string }[];

function initials(user: AdminUserSummary) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function UsersPanel() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [bannedFilter, setBannedFilter] = useState<BannedFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUserSummary | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchAdminUsers(getToken, {
        search: submittedSearch || undefined,
        banned: bannedFilter === 'all' ? undefined : bannedFilter,
      }),
    [submittedSearch, bannedFilter],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const confirmBan = useCallback(
    async (reason: string) => {
      if (!banTarget) return;
      setActionError(null);
      setActioningId(banTarget.id);
      try {
        await banUser(getToken, banTarget.id, reason);
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Ban failed');
      } finally {
        setActioningId(null);
        setBanTarget(null);
      }
    },
    [banTarget, getToken, reload],
  );

  const runUnban = useCallback(
    async (user: AdminUserSummary) => {
      setActionError(null);
      setActioningId(user.id);
      try {
        await unbanUser(getToken, user.id);
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Unban failed');
      } finally {
        setActioningId(null);
      }
    },
    [getToken, reload],
  );

  const columns = useMemo<ColumnDef<AdminUserSummary, unknown>[]>(
    () => [
      {
        id: 'user',
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {initials(row.original)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {row.original.firstName} {row.original.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                Joined {new Date(row.original.createdAt).toLocaleDateString('en-KE')}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'contact',
        accessorFn: (row) => row.phoneNumber ?? row.email ?? '',
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-foreground">
              {row.original.phoneNumber ?? '—'}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.email ?? ''}
            </div>
          </div>
        ),
      },
      {
        id: 'role',
        accessorFn: (row) => row.role,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => (
          <span className="text-xs font-medium tracking-wide text-muted-foreground">
            {row.original.role}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => (row.isBanned ? 'Banned' : row.isActive ? 'Active' : 'Inactive'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <StatusBadge
            label={
              row.original.isBanned ? 'Banned' : row.original.isActive ? 'Active' : 'Inactive'
            }
            tone={row.original.isBanned ? 'danger' : row.original.isActive ? 'positive' : 'warning'}
          />
        ),
      },
      {
        id: 'listingsCount',
        accessorFn: (row) => row.listingsCount,
        meta: { align: 'right' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Listings" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">{row.original.listingsCount}</span>
        ),
      },
      {
        id: 'unlocksCount',
        accessorFn: (row) => row.unlocksCount,
        meta: { align: 'right' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Unlocks" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">{row.original.unlocksCount}</span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        meta: { align: 'right' },
        header: () => <span className="block text-right">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          if (user.role === 'ADMIN') {
            return <span className="text-xs text-muted-foreground">Protected</span>;
          }
          return (
            <Button
              size="sm"
              variant={user.isBanned ? 'outline' : 'destructive'}
              disabled={actioningId === user.id}
              onClick={() => (user.isBanned ? void runUnban(user) : setBanTarget(user))}
            >
              {actioningId === user.id ? '…' : user.isBanned ? 'Unban' : 'Ban'}
            </Button>
          );
        },
      },
    ],
    [actioningId, runUnban],
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Users"
        title="Account directory"
        description="Search the register, review moderation state, and ban or reinstate accounts. A ban revokes live sessions across web and mobile."
      />

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
          placeholder="Search name or email"
        />
        <AdminFilterTabs
          label="Filter by ban state"
          options={BANNED_FILTERS}
          value={bannedFilter}
          onChange={setBannedFilter}
        />
      </AdminToolbar>

      {actionError ? <AdminNotice message={actionError} /> : null}
      {error ? <AdminNotice message={error} onRetry={() => void reload()} /> : null}

      <DataTable
        columns={columns}
        data={data?.data}
        isLoading={loading}
        getRowId={(row) => row.id}
        emptyIcon={<UserX className="size-5" />}
        emptyTitle="No users found"
        emptyDescription={
          submittedSearch
            ? `Nothing matches “${submittedSearch}” with the current filter.`
            : 'No accounts match the current filter.'
        }
        summary={data ? `${data.meta.total} users` : null}
      />

      <ReasonDialog
        open={banTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBanTarget(null);
        }}
        title={banTarget ? `Ban ${banTarget.firstName} ${banTarget.lastName}?` : 'Ban user'}
        description="This revokes their sessions immediately and locks them out of web and mobile. The reason is kept on record."
        placeholder="Why is this account being banned?"
        submitLabel="Ban account"
        minLength={5}
        destructive
        onSubmit={(reason) => void confirmBan(reason)}
      />
    </div>
  );
}

/**
 * Purpose: Admin user directory — search, banned filter, and ban/unban with a
 *   required reason.
 * Why important: The console's account-moderation surface; bans revoke
 *   sessions via the API and lock the user out of both apps.
 * Used by: app/admin/users/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminUserSummary } from '@pataspace/contracts';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { useAdminData } from '@/components/admin/use-admin-data';
import { banUser, fetchAdminUsers, unbanUser } from '@/lib/api/admin';

type BannedFilter = 'all' | 'true' | 'false';

export function UsersPanel() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [bannedFilter, setBannedFilter] = useState<BannedFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchAdminUsers(getToken, {
        search: submittedSearch || undefined,
        banned: bannedFilter === 'all' ? undefined : bannedFilter,
      }),
    [submittedSearch, bannedFilter],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const toggleBan = async (user: AdminUserSummary) => {
    setActionError(null);
    if (!user.isBanned) {
      const reason = window.prompt(
        `Ban ${user.firstName} ${user.lastName}? Reason (required, kept on record):`,
      );
      if (!reason || reason.trim().length < 5) {
        setActionError('A ban needs a reason of at least 5 characters.');
        return;
      }
      setActioningId(user.id);
      try {
        await banUser(getToken, user.id, reason.trim());
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Ban failed');
      } finally {
        setActioningId(null);
      }
      return;
    }

    setActioningId(user.id);
    try {
      await unbanUser(getToken, user.id);
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unban failed');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Users
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Account directory
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedSearch(search.trim());
          }}
        >
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
          />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
        <div className="flex gap-1">
          {(['all', 'false', 'true'] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={bannedFilter === option ? 'default' : 'outline'}
              onClick={() => setBannedFilter(option)}
            >
              {option === 'all' ? 'All' : option === 'true' ? 'Banned' : 'Active'}
            </Button>
          ))}
        </div>
      </div>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Unlocks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.data ?? []).map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString('en-KE')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block text-sm">{user.phoneNumber ?? '—'}</span>
                  <span className="block text-xs text-muted-foreground">{user.email ?? ''}</span>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                    tone={user.isBanned ? 'danger' : user.isActive ? 'positive' : 'warning'}
                  />
                </TableCell>
                <TableCell>{user.listingsCount}</TableCell>
                <TableCell>{user.unlocksCount}</TableCell>
                <TableCell className="text-right">
                  {user.role === 'ADMIN' ? (
                    <span className="text-xs text-muted-foreground">Protected</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={user.isBanned ? 'outline' : 'destructive'}
                      disabled={actioningId === user.id}
                      onClick={() => void toggleBan(user)}
                    >
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="text-xs text-muted-foreground">{data ? `${data.meta.total} users` : ''}</p>
    </div>
  );
}

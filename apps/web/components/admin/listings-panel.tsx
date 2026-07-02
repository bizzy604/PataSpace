/**
 * Purpose: Admin listings workspace — moderation queue tab plus the full
 *   catalogue with status filter, search, edit, and soft delete.
 * Why important: This is the CRUD surface for live marketplace inventory.
 * Used by: app/admin/listings/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminListingSummary, AdminUpdateListingRequest } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { ListingEditSheet } from '@/components/admin/listing-edit-sheet';
import { ModerationQueue } from '@/components/admin/moderation-queue';
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

  const removeListing = async (listing: AdminListingSummary) => {
    const reason = window.prompt(
      `Soft-delete the ${listing.neighborhood} listing? Optional reason:`,
    );
    if (reason === null) {
      return;
    }
    setActionError(null);
    try {
      await deleteAdminListing(getToken, listing.id, reason.trim() || undefined);
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Listings
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Moderation and catalogue
        </h1>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Moderation queue</TabsTrigger>
          <TabsTrigger value="catalogue">Full catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="pt-4">
          <ModerationQueue />
        </TabsContent>

        <TabsContent value="catalogue" className="space-y-4 pt-4">
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
              placeholder="Search county or neighborhood"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>

          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unlocks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data ?? []).map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <span className="font-medium">{listing.neighborhood}</span>
                      <span className="block text-xs text-muted-foreground">
                        {listing.county} · {listing.houseType.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {listing.owner.firstName} {listing.owner.lastName}
                    </TableCell>
                    <TableCell>{formatKes(listing.monthlyRent)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={listing.isDeleted ? 'DELETED' : listing.status}
                        tone={statusTone[listing.isDeleted ? 'DELETED' : listing.status] ?? 'neutral'}
                      />
                    </TableCell>
                    <TableCell>{listing.unlockCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={listing.isDeleted}
                          onClick={() => setEditing(listing)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={listing.isDeleted}
                          onClick={() => void removeListing(listing)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground">
            {data ? `${data.meta.total} listings` : ''}
          </p>
        </TabsContent>
      </Tabs>

      <ListingEditSheet listing={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
    </div>
  );
}

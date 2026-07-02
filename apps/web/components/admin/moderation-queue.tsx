/**
 * Purpose: Pending-listing moderation queue — approve or reject with reason.
 * Why important: Listings only go live through this queue; it is the console's
 *   highest-frequency workflow.
 * Used by: components/admin/listings-panel.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminData } from '@/components/admin/use-admin-data';
import { approveListing, fetchPendingListings, rejectListing } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

export function ModerationQueue() {
  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchPendingListings(getToken),
    [],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (listingId: string, action: 'approve' | 'reject') => {
    setActionError(null);
    let reason: string | null = null;
    if (action === 'reject') {
      reason = window.prompt('Rejection reason (sent to the outgoing tenant):');
      if (!reason || reason.trim().length < 5) {
        setActionError('Rejection needs a reason of at least 5 characters.');
        return;
      }
    }
    setActioningId(listingId);
    try {
      if (action === 'approve') {
        await approveListing(getToken, listingId);
      } else {
        await rejectListing(getToken, listingId, reason!.trim());
      }
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Action failed');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const pending = data?.data ?? [];

  if (pending.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Queue is clear</CardTitle>
          <CardDescription>No listings are waiting for review.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {pending.map((listing) => (
        <Card key={listing.id} className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {listing.neighborhood}, {listing.county} · {formatKes(listing.monthlyRent)}/mo
            </CardTitle>
            <CardDescription>
              {listing.houseType.replaceAll('_', ' ').toLowerCase()} · posted by{' '}
              {listing.tenant.firstName} ({listing.tenant.phoneNumber}) ·{' '}
              {listing.photos.length} photos · waiting {listing.daysWaiting}d
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              size="sm"
              disabled={actioningId === listing.id}
              onClick={() => void act(listing.id, 'approve')}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actioningId === listing.id}
              onClick={() => void act(listing.id, 'reject')}
            >
              Reject
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Purpose: Pending-listing moderation queue — approve or reject with reason,
 *   with the uploaded photos and walkthrough video rendered inline so the
 *   admin verifies the actual media before approving.
 * Why important: Listings only go live through this queue; it is the console's
 *   highest-frequency workflow.
 * Used by: components/admin/listings-panel.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminPendingListing } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminData } from '@/components/admin/use-admin-data';
import { approveListing, fetchPendingListings, rejectListing } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';

// Plain <img> on purpose: media lives on S3/CDN outside next/image's
// configured remote patterns, and the queue needs the exact stored URL to
// fail visibly (broken image) when the media pipeline is misconfigured.
function ListingMediaGrid({ listing }: { listing: AdminPendingListing }) {
  const photos = [...listing.photos].sort((a, b) => a.order - b.order);

  if (photos.length === 0 && !listing.videoUrl) {
    return <p className="text-sm text-destructive">No media on this listing.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <a
            key={photo.order}
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            title={`Photo ${photo.order} — open full size`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Listing photo ${photo.order}`}
              loading="lazy"
              className="h-24 w-32 rounded-md border border-border object-cover"
            />
          </a>
        ))}
      </div>
      {listing.videoUrl ? (
        <video
          src={listing.videoUrl}
          controls
          preload="metadata"
          className="h-40 max-w-full rounded-md border border-border"
        />
      ) : null}
    </div>
  );
}

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
          <CardContent className="space-y-4">
            <ListingMediaGrid listing={listing} />
            <div className="flex gap-3">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

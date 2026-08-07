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
import { CheckCircle2, Clock, ImageOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNotice } from '@/components/admin/admin-chrome';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { useAdminData } from '@/components/admin/use-admin-data';
import { approveListing, fetchPendingListings, rejectListing } from '@/lib/api/admin';
import { formatKes } from '@/lib/format';
import { cn } from '@/lib/utils';

// Plain <img> on purpose: media lives on S3/CDN outside next/image's
// configured remote patterns, and the queue needs the exact stored URL to
// fail visibly (broken image) when the media pipeline is misconfigured.
function ListingMediaGrid({ listing }: { listing: AdminPendingListing }) {
  const photos = [...listing.photos].sort((a, b) => a.order - b.order);

  if (photos.length === 0 && !listing.videoUrl) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <ImageOff className="size-4 shrink-0" />
        No media on this listing.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <a
              key={photo.order}
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              title={`Photo ${photo.order} — open full size`}
              className="group relative overflow-hidden rounded-lg border border-border transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Listing photo ${photo.order}`}
                loading="lazy"
                className="h-24 w-32 object-cover transition-transform group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-foreground">
                {photo.order}
              </span>
            </a>
          ))}
        </div>
      ) : null}
      {listing.videoUrl ? (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Video className="size-3.5" />
            Walkthrough
          </p>
          <video
            src={listing.videoUrl}
            controls
            preload="metadata"
            className="h-40 max-w-full rounded-lg border border-border"
          />
        </div>
      ) : null}
    </div>
  );
}

function MetaChip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone === 'warning'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
          : 'border-border bg-muted text-muted-foreground',
      )}
    >
      {children}
    </span>
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
  const [rejectTarget, setRejectTarget] = useState<AdminPendingListing | null>(null);

  const runApprove = useCallback(
    async (listingId: string) => {
      setActionError(null);
      setActioningId(listingId);
      try {
        await approveListing(getToken, listingId);
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Action failed');
      } finally {
        setActioningId(null);
      }
    },
    [getToken, reload],
  );

  const confirmReject = useCallback(
    async (reason: string) => {
      if (!rejectTarget) return;
      const listingId = rejectTarget.id;
      setRejectTarget(null);
      setActionError(null);
      setActioningId(listingId);
      try {
        await rejectListing(getToken, listingId, reason.trim());
        await reload();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Action failed');
      } finally {
        setActioningId(null);
      }
    },
    [getToken, rejectTarget, reload],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <AdminNotice message={error} onRetry={() => void reload()} />;
  }

  const pending = data?.data ?? [];

  return (
    <div className="space-y-4">
      {actionError ? <AdminNotice message={actionError} /> : null}

      {pending.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="text-sm font-medium text-foreground">Queue is clear</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            No listings are waiting for review.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {pending.length} listing{pending.length === 1 ? '' : 's'} awaiting review
          </p>

          {pending.map((listing) => {
            const busy = actioningId === listing.id;
            return (
              <article
                key={listing.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {listing.neighborhood}, {listing.county}
                      <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                        {formatKes(listing.monthlyRent)}/mo
                      </span>
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {listing.houseType.replaceAll('_', ' ').toLowerCase()} · posted by{' '}
                      {listing.tenant.firstName} ({listing.tenant.phoneNumber})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <MetaChip>
                        {listing.photos.length} photo{listing.photos.length === 1 ? '' : 's'}
                      </MetaChip>
                      {listing.videoUrl ? <MetaChip>Video attached</MetaChip> : null}
                      <MetaChip tone={listing.daysWaiting >= 3 ? 'warning' : 'neutral'}>
                        <Clock className="size-3" />
                        waiting {listing.daysWaiting}d
                      </MetaChip>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button disabled={busy} onClick={() => void runApprove(listing.id)}>
                      {busy ? 'Working…' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => setRejectTarget(listing)}
                    >
                      Reject
                    </Button>
                  </div>
                </header>
                <div className="px-5 py-4">
                  <ListingMediaGrid listing={listing} />
                </div>
              </article>
            );
          })}
        </>
      )}

      <ReasonDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title={
          rejectTarget
            ? `Reject the ${rejectTarget.neighborhood} listing?`
            : 'Reject listing'
        }
        description="The reason is sent to the outgoing tenant, so be specific about what needs fixing."
        placeholder="Rejection reason (required)"
        submitLabel="Reject listing"
        minLength={5}
        destructive
        onSubmit={(reason) => void confirmReject(reason)}
      />
    </div>
  );
}

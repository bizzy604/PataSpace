/**
 * Purpose: Server page for tenant unlock review submission.
 * Why important: Lets a tenant rate their move-in experience once both parties
 *   have confirmed. The backend rejects reviews before confirmation, so the
 *   page also surfaces a friendly explanation when the unlock is not yet
 *   in the `confirmed` state.
 * Used by: Next.js routing for /unlocks/[id]/review.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Star } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { MyUnlockRecord } from '@pataspace/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { ReviewForm } from '@/components/reviews/review-form';
import { getMyUnlocks } from '@/lib/api/unlocks';
import { linkButtonClass } from '@/lib/link-button';

function describeListing(listing: MyUnlockRecord['listing']) {
  return listing.bedrooms === 0
    ? `Studio · ${listing.neighborhood}`
    : `${listing.bedrooms}BR · ${listing.neighborhood}`;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();

  const response = await getMyUnlocks(token, 1, 100).catch(() => null);
  const unlock = response?.data.find((entry) => entry.unlockId === id) ?? null;

  if (!unlock) {
    notFound();
  }

  const listingTitle = describeListing(unlock.listing);
  const canReview = unlock.status === 'confirmed';

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Rate your experience"
      description="Leave a quick 1-5 rating after both parties confirm the handover. Comments help future tenants trust the listing."
      actions={
        <Link
          href={`/unlocks/${unlock.unlockId}`}
          className={linkButtonClass({ variant: 'outline', size: 'sm' })}
        >
          Back to unlock
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">
              Review form
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Reviews are public-facing trust signals — keep it factual and brief.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canReview ? (
              <ReviewForm unlockId={unlock.unlockId} />
            ) : (
              <div className="border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                You can leave a review once both parties have confirmed the move-in. Until
                then this unlock is still in {unlock.status.replace('_', ' ')}.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <Star className="size-4 text-primary" />
              {listingTitle}
            </p>
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <CheckCircle2 className="size-4 text-primary" />
              Status: {unlock.status.replace('_', ' ')}
            </p>
            <p>
              Reviews are gated to participants of a confirmed unlock, and each side can
              leave at most one review per unlock. Backend enforces this — you cannot
              submit twice.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

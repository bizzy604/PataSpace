/**
 * Purpose: Server page that renders the dispute filing surface for an unlock.
 * Why important: Loads the unlock from the backend and delegates submission to
 *   a client form that POSTs /disputes — replacing the previous mock-state UI.
 * Used by: Next.js routing for /unlocks/[id]/dispute.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquareWarning, ShieldAlert } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { DisputeRecord, MyUnlockRecord } from '@pataspace/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { DisputeForm } from '@/components/disputes/dispute-form';
import { getMyUnlocks } from '@/lib/api/unlocks';
import { getDispute } from '@/lib/api/disputes';
import { formatDateLabel } from '@/lib/format';
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
  const alreadyDisputed = unlock.dispute !== null;
  const dispute: DisputeRecord | null = unlock.dispute
    ? await getDispute(token, unlock.dispute.id).catch(() => null)
    : null;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Dispute or report issue"
      description="File a dispute when the revealed listing context does not match the reality of the handover or the documented evidence."
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
              Dispute form
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Report listing mismatch, access problems, or landlord outcome issues tied to this unlock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alreadyDisputed ? (
              <div className="border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                A dispute is already open against this unlock. Admins are
                working through OPEN → INVESTIGATING → RESOLVED → CLOSED. You
                can file an additional report from support if context has
                changed.
              </div>
            ) : (
              <DisputeForm unlockId={unlock.unlockId} listingTitle={listingTitle} />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Current dispute state
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <MessageSquareWarning className="size-4 text-primary" />
              {listingTitle}
            </p>
            {dispute ? (
              <div className="space-y-3 border border-background/10 bg-background/6 p-4">
                <p className="font-medium text-background">Status: {dispute.status}</p>
                <p>Reported {formatDateLabel(dispute.createdAt)}</p>
                <p>Reason: {dispute.reason}</p>
                {dispute.resolution ? <p>Resolution: {dispute.resolution}</p> : null}
                {dispute.refundAmount ? (
                  <p>Refunded {dispute.refundAmount} credits to your wallet.</p>
                ) : null}
              </div>
            ) : (
              <div className="border border-background/10 bg-background/6 p-4">
                {alreadyDisputed
                  ? 'A dispute is open for this unlock and will progress through admin review.'
                  : 'No dispute has been filed yet for this unlock.'}
              </div>
            )}
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <ShieldAlert className="size-4 text-primary" />
              Admin review path
            </p>
            <p>
              Valid disputes can change the unlock outcome and trigger refunds, which then flow back into the wallet ledger.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

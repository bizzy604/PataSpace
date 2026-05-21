/**
 * Purpose: Server page that renders the tenant move-in confirmation surface.
 * Why important: Fetches the live unlock from /unlocks/my-unlocks so the
 *   confirmation form points at a real backend record instead of mock data.
 * Used by: Next.js routing for /unlocks/[id]/confirm.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
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
import { ConfirmMoveInForm } from '@/components/unlocks/confirm-move-in-form';
import { getMyUnlocks } from '@/lib/api/unlocks';
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
  const alreadyConfirmed = unlock.myConfirmation !== null;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Confirm move-in"
      description="Use the confirmation step to document that contact led to a successful housing handover."
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
              Confirmation checklist
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Confirm only after you have spoken to the outgoing tenant and validated the handover outcome.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmMoveInForm
              unlockId={unlock.unlockId}
              alreadyConfirmed={alreadyConfirmed}
            />
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Unlock context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <ClipboardCheck className="size-4 text-primary" />
              {listingTitle}
            </p>
            <p>Unlocked on {formatDateLabel(unlock.createdAt)}</p>
            <p>
              Your first confirmation was{' '}
              {alreadyConfirmed ? 'already recorded' : 'not yet recorded'}.
            </p>
            <p>
              Once both sides confirm, the owner-side commission workflow becomes eligible to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

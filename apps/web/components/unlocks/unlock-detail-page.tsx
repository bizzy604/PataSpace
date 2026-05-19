/**
 * Purpose: Renders the full unlock contact reveal for an incoming tenant.
 * Why important: This is the payoff screen — it shows the address, phone, and GPS the tenant unlocked.
 * Used by: apps/web/app/unlocks/[id]/page.tsx
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, MapPinned, Phone, ShieldCheck } from 'lucide-react';
import type { MyUnlockRecord } from '@pataspace/contracts';
import { RevealedLocationMap } from '@/components/map/page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, unlockStatusMeta } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

function computeTitle(listing: MyUnlockRecord['listing']): string {
  return listing.bedrooms === 0
    ? `Studio · ${listing.neighborhood}`
    : `${listing.bedrooms}BR · ${listing.neighborhood}`;
}

function nextStepText(record: MyUnlockRecord): string {
  if (record.status === 'confirmed') return 'Both parties have confirmed this unlock.';
  if (record.myConfirmation) return 'Your confirmation recorded — awaiting the tenant.';
  return 'Contact the tenant and confirm the handover when done.';
}

export function UnlockDetailPage({
  unlock,
  tenantFirstName,
}: {
  unlock: MyUnlockRecord | null;
  tenantFirstName: string | null;
}) {
  if (!unlock) notFound();

  const status = unlockStatusMeta(unlock.status);
  const title = computeTitle(unlock.listing);
  const latitude = unlock.contactInfo.latitude ?? 0;
  const longitude = unlock.contactInfo.longitude ?? 0;
  const hasGps = unlock.contactInfo.latitude !== undefined;

  const contactRows = [
    unlock.contactInfo.phoneNumber && {
      label: 'Outgoing tenant number',
      value: unlock.contactInfo.phoneNumber,
      action: 'Call tenant',
      Icon: Phone,
    },
    {
      label: 'Exact address',
      value: unlock.contactInfo.address,
      action: 'Open address',
      Icon: MapPinned,
    },
    hasGps && {
      label: 'Exact GPS location',
      value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      action: 'Open map',
      Icon: MapPinned,
    },
  ].filter(Boolean) as { label: string; value: string; action: string; Icon: typeof Phone }[];

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Contact information"
      description="Unlocked contact details, next-step guidance, and confirmation or dispute follow-through for this listing."
      actions={
        <>
          <Link
            href={`/unlocks/${unlock.unlockId}/confirm`}
            className={linkButtonClass({ size: 'sm' })}
          >
            Confirm move-in
          </Link>
          <Link
            href={`/unlocks/${unlock.unlockId}/dispute`}
            className={linkButtonClass({ variant: 'outline', size: 'sm' })}
          >
            Report issue
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="border border-primary/30 bg-primary/10 p-5 text-primary">
            <p className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-5" />
              Contact unlocked successfully
            </p>
            <p className="mt-2 text-sm leading-7">
              You can now call the current tenant, open the exact address, and continue through confirmation or dispute if needed.
            </p>
          </div>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={status.label} tone={status.tone} />
                <StatusBadge label={`Unlocked ${formatDateLabel(unlock.createdAt)}`} tone="neutral" />
              </div>
              <CardTitle className="text-3xl font-semibold text-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenantFirstName ? (
                <div className="border border-border bg-muted p-5">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg">
                      <AvatarFallback>{tenantFirstName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {tenantFirstName}
                      </p>
                      <p className="text-sm text-muted-foreground">Current tenant</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {contactRows.map(({ label, value, action, Icon }) => (
                <div
                  key={label}
                  className="flex flex-wrap items-center justify-between gap-4 border border-border bg-muted p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 items-center justify-center border border-border bg-card text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="mt-1 break-all text-sm leading-7 text-muted-foreground">{value}</p>
                    </div>
                  </div>
                  <span className="border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    {action}
                  </span>
                </div>
              ))}

              {hasGps ? (
                <RevealedLocationMap
                  address={unlock.contactInfo.address}
                  latitude={latitude}
                  longitude={longitude}
                  title={title}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border bg-foreground text-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-background">
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-background/76">
              <p>1. Reach the tenant through the unlocked phone number.</p>
              <p>2. Use the revealed address and map pin to reach the unit.</p>
              <p>3. Use the confirmation route if the move-in succeeds, or the dispute route if the listing context breaks down.</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">
                Unlock timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Unlocked', body: `Completed on ${formatDateLabel(unlock.createdAt)}`, tone: 'positive' as const },
                { title: 'Confirm connection', body: nextStepText(unlock), tone: unlock.status === 'pending_confirmation' ? 'warning' as const : 'brand' as const },
                { title: 'Dispute protection', body: unlock.status === 'disputed' ? 'A dispute is open for this unlock.' : 'Available if the listing context does not match reality.', tone: unlock.status === 'disputed' ? 'danger' as const : 'neutral' as const },
              ].map((item) => (
                <div key={item.title} className="border border-border bg-muted p-4">
                  <StatusBadge label={item.title} tone={item.tone} />
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="space-y-4 p-6">
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Reminder
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                Repeat unlocks stay protected from double-charge, and any validated dispute can return credits through the same wallet ledger.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantWorkspaceShell>
  );
}

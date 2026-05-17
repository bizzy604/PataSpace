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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <p className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-5" />
              Contact unlocked successfully
            </p>
            <p className="mt-2 text-sm leading-7">
              You can now call the current tenant, open the exact address, and continue through confirmation or dispute if needed.
            </p>
          </div>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={status.label} tone={status.tone} />
                <StatusBadge label={`Unlocked ${formatDateLabel(unlock.createdAt)}`} tone="neutral" />
              </div>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenantFirstName ? (
                <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-5">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg">
                      <AvatarFallback>{tenantFirstName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                        {tenantFirstName}
                      </p>
                      <p className="text-sm text-[#62686a]">Current tenant</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {contactRows.map(({ label, value, action, Icon }) => (
                <div
                  key={label}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#252525]">{label}</p>
                      <p className="mt-1 break-all text-sm leading-7 text-[#62686a]">{value}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-[#4b4f50]">
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
          <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-white/76">
              <p>1. Reach the tenant through the unlocked phone number.</p>
              <p>2. Use the revealed address and map pin to reach the unit.</p>
              <p>3. Use the confirmation route if the move-in succeeds, or the dispute route if the listing context breaks down.</p>
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Unlock timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Unlocked', body: `Completed on ${formatDateLabel(unlock.createdAt)}`, tone: 'positive' as const },
                { title: 'Confirm connection', body: nextStepText(unlock), tone: unlock.status === 'pending_confirmation' ? 'warning' as const : 'brand' as const },
                { title: 'Dispute protection', body: unlock.status === 'disputed' ? 'A dispute is open for this unlock.' : 'Available if the listing context does not match reality.', tone: unlock.status === 'disputed' ? 'danger' as const : 'neutral' as const },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                  <StatusBadge label={item.title} tone={item.tone} />
                  <p className="mt-3 text-sm leading-7 text-[#62686a]">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardContent className="space-y-4 p-6">
              <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                <ShieldCheck className="size-4 text-[#28809A]" />
                Reminder
              </p>
              <p className="text-sm leading-7 text-[#62686a]">
                Repeat unlocks stay protected from double-charge, and any validated dispute can return credits through the same wallet ledger.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantWorkspaceShell>
  );
}

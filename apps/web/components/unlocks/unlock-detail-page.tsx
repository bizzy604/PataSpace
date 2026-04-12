import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Compass, MapPinned, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { RevealedLocationMap } from '@/components/map/page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, unlockStatusMeta } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { getMockUnlockBundle } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export function UnlockDetailPage({ id }: { id: string }) {
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing, dispute } = bundle;
  const status = unlockStatusMeta(unlock.status);
  const latitude = listing.contactInfo.latitude;
  const longitude = listing.contactInfo.longitude;

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Contact information"
      description="Unlocked contact details, next-step guidance, and confirmation or dispute follow-through for this listing."
      actions={
        <>
          <Link href={`/unlocks/${unlock.unlockId}/confirm`} className={linkButtonClass({ size: 'sm' })}>
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
                {listing.title}
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                The exact reveal now includes the outgoing tenant phone, caretaker access contact, exact directions, and precise GPS while preserving the follow-through timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-5">
                <div className="flex items-center gap-4">
                  <Avatar size="lg">
                    <AvatarFallback>
                      {listing.tenant.firstName[0]}
                      {listing.tenant.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                      {listing.tenant.firstName} {listing.tenant.lastName}
                    </p>
                    <p className="text-sm text-[#62686a]">Current tenant</p>
                  </div>
                </div>
              </div>

              {[
                {
                  label: 'Outgoing tenant number',
                  value: listing.tenant.phoneNumber,
                  action: 'Call tenant',
                  Icon: Phone,
                },
                {
                  label: 'Caretaker / access contact',
                  value: `${listing.caretaker.name} • ${listing.caretaker.phoneNumber}`,
                  action: 'Call caretaker',
                  Icon: UserRound,
                },
                {
                  label: 'Exact address',
                  value: listing.contactInfo.address,
                  action: 'Open address',
                  Icon: MapPinned,
                },
                {
                  label: 'Directions',
                  value: listing.directions,
                  action: 'Use directions',
                  Icon: Compass,
                },
                {
                  label: 'Exact GPS location',
                  value: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                  action: 'Open map',
                  Icon: MapPinned,
                },
              ].map(({ label, value, action, Icon }) => (
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

              <RevealedLocationMap
                address={listing.contactInfo.address}
                latitude={latitude}
                longitude={longitude}
                title={listing.title}
              />
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
              <p>1. Reach the tenant through the unlocked phone number or WhatsApp-equivalent flow.</p>
              <p>2. Use the revealed directions and exact map pin to reach the unit without guessing.</p>
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
                { title: 'Confirm connection', body: unlock.nextStep, tone: unlock.status === 'pending_confirmation' ? 'warning' as const : 'brand' as const },
                { title: 'Dispute protection', body: dispute ? dispute.reason : 'Available if the listing context does not match reality.', tone: dispute ? 'danger' as const : 'neutral' as const },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge label={item.title} tone={item.tone} />
                  </div>
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

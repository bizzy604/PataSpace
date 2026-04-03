import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPinned, Phone, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { StatusBadge, unlockStatusMeta } from '@/components/shared/status-badge';
import { getMockUnlockBundle } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { listing, unlock, dispute } = bundle;
  const visual = getListingVisual(listing.id);
  const status = unlockStatusMeta(unlock.status);

  return (
    <TenantWorkspaceShell
      pathname="/unlocks"
      title="Unlock detail"
      description="This record holds the paid reveal, exact contact details, and all follow-through actions tied to the same unlock."
      actions={
        <>
          <Link href={`/unlocks/${unlock.unlockId}/confirm`} className={linkButtonClass({ size: 'sm' })}>
            Confirm move-in
          </Link>
          <Link href={`/unlocks/${unlock.unlockId}/dispute`} className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Report issue
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <div className="relative h-72">
            <Image
              src={visual.hero}
              alt={visual.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          </div>
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={status.label} tone={status.tone} />
              <StatusBadge label={formatKes(unlock.creditsSpent)} tone="brand" />
            </div>
            <div>
              <p className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                {listing.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#62686a]">
                Unlocked on {formatDateLabel(unlock.createdAt)}. {unlock.nextStep}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-5">
                <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                  <Phone className="size-4 text-[#28809A]" />
                  Contact revealed
                </p>
                <p className="mt-3 text-sm text-[#62686a]">{listing.contactInfo.phoneNumber}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-5">
                <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                  <MapPinned className="size-4 text-[#28809A]" />
                  Exact address
                </p>
                <p className="mt-3 text-sm leading-7 text-[#62686a]">{listing.contactInfo.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                Confirmation timeline
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Both sides can confirm from their own workflow. Disputes can pause or alter the outcome.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
              <div className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                <p className="font-medium text-[#252525]">Your confirmation</p>
                <p className="mt-2">{unlock.myConfirmation ? formatDateLabel(unlock.myConfirmation) : 'Not yet submitted'}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                <p className="font-medium text-[#252525]">Outgoing tenant confirmation</p>
                <p className="mt-2">
                  {unlock.tenantConfirmation ? formatDateLabel(unlock.tenantConfirmation) : 'Still waiting from the current tenant'}
                </p>
              </div>
              <div className="rounded-[24px] border border-[#28809A]/12 bg-[#28809A]/6 p-4">
                <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                  <ShieldCheck className="size-4 text-[#28809A]" />
                  Next action
                </p>
                <p className="mt-2">{unlock.nextStep}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                Dispute state
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
              {dispute ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-amber-800">
                    <TriangleAlert className="size-4" />
                    {dispute.status}
                  </p>
                  <p className="mt-2">{dispute.reason}</p>
                  {dispute.resolution ? <p className="mt-2">{dispute.resolution}</p> : null}
                </div>
              ) : (
                <div className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                  No dispute has been raised for this unlock.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantWorkspaceShell>
  );
}

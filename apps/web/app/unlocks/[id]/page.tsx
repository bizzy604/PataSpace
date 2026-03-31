import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPinned, MessageSquare, Phone, Share2 } from 'lucide-react';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { getMockUnlockBundle } from '@/lib/mock-app-state';

type UnlockDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UnlockDetailPage({ params }: UnlockDetailPageProps) {
  const { id } = await params;
  const bundle = getMockUnlockBundle(id);

  if (!bundle) {
    notFound();
  }

  const { unlock, listing, dispute } = bundle;
  const visual = getListingVisual(listing.id);
  const outgoingCommission = Math.round(unlock.creditsSpent * 0.3);

  return (
    <section className="bg-[#EDEDED]">
      <div className="bg-[#28809A] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-3 text-center text-lg font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/16">OK</span>
          Contact Information Unlocked!
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,760px)_320px]">
        <div className="space-y-6">
          <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {visual.gallery.slice(0, 3).map((image, index) => (
                <div key={image} className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[16px]">
                  <Image src={image} alt={`${listing.title} preview ${index + 1}`} fill className="object-cover" sizes="100px" />
                </div>
              ))}
            </div>
            <p className="mt-5 font-display text-3xl font-bold tracking-[-0.04em] text-[#252525]">{listing.title}</p>
            <p className="mt-2 text-base text-[#8D9192]">
              {formatKes(listing.monthlyRent)}/mo / Unlocked {formatDateLabel(unlock.createdAt)}
            </p>

            <div className="mt-8 rounded-[20px] bg-[#EDEDED] p-6">
              <div className="flex flex-wrap items-start gap-5">
                <div className="flex size-20 items-center justify-center rounded-full border-2 border-[#28809A] bg-white text-xl font-bold text-[#252525]">
                  {listing.tenant.firstName[0]}
                  {listing.tenant.lastName[0]}
                </div>
                <div>
                  <p className="font-display text-3xl font-bold tracking-[-0.04em] text-[#252525]">
                    {listing.tenant.firstName} {listing.tenant.lastName}
                  </p>
                  <p className="mt-2 text-sm text-[#8D9192]">Current Tenant / Since {formatDateLabel(listing.tenant.joinedDate)}</p>
                </div>
              </div>

              <div className="mt-8 divide-y divide-white/70 rounded-[18px] bg-white px-4">
                {[
                  { label: 'Phone', value: listing.contactInfo.phoneNumber, action: 'Call', Icon: Phone },
                  { label: 'WhatsApp', value: listing.contactInfo.phoneNumber, action: 'Message', Icon: MessageSquare },
                  { label: 'Address', value: listing.contactInfo.address, action: 'Copy', Icon: MapPinned },
                  {
                    label: 'GPS',
                    value: `${listing.contactInfo.latitude}, ${listing.contactInfo.longitude}`,
                    action: 'Open in Maps',
                    Icon: Share2,
                  },
                ].map(({ label, value, action, Icon }) => (
                  <div key={label} className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#252525]">{label}</p>
                        <p className="mt-1 text-sm text-[#8D9192]">{value}</p>
                      </div>
                    </div>
                    <button type="button" className="rounded-full border border-[#28809A] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#28809A]">
                      {action}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <button type="button" className="inline-flex h-14 items-center justify-center rounded-full bg-[#28809A] text-sm font-semibold text-white">
                  Call Now
                </button>
                <button type="button" className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">What&apos;s Next?</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {[
                ['Contact Unlocked', 'done'],
                ['View Property', 'active'],
                ['Confirm Connection', unlock.myConfirmation ? 'done' : 'todo'],
                ['Commission Paid', unlock.tenantConfirmation ? 'active' : 'todo'],
              ].map(([label, state]) => (
                <div key={label} className="relative rounded-[18px] bg-[#EDEDED] px-4 py-5">
                  <span
                    className={`inline-flex size-9 items-center justify-center rounded-full text-sm font-bold ${
                      state === 'done'
                        ? 'bg-emerald-500 text-white'
                        : state === 'active'
                          ? 'bg-[#28809A] text-white'
                          : 'bg-white text-[#8D9192]'
                    }`}
                    >
                      {state === 'done' ? 'OK' : '...'}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-[#252525]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-[#8D9192]">
              After viewing the property, confirm whether you are moving in so the handover tracker stays accurate.
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Status tracker</p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">
                  Unlock progression
                </h2>
              </div>
              <Link href={`/unlocks/${unlock.unlockId}/confirm`} className="rounded-full bg-[#28809A] px-5 py-3 text-sm font-semibold text-white">
                Continue
              </Link>
            </div>

            <div className="mt-8 space-y-6">
              {[
                { title: 'Contact Unlocked', body: `Unlocked on ${formatDateLabel(unlock.createdAt)}`, state: 'done' },
                { title: 'Property Viewed', body: 'Mark after the in-person visit completes.', state: 'todo' },
                {
                  title: 'Your Confirmation',
                  body: unlock.myConfirmation ? `Confirmed on ${formatDateLabel(unlock.myConfirmation)}` : 'Pending your confirmation.',
                  state: unlock.myConfirmation ? 'done' : 'todo',
                },
                {
                  title: 'Outgoing Tenant',
                  body: unlock.tenantConfirmation
                    ? `Confirmed on ${formatDateLabel(unlock.tenantConfirmation)}`
                    : 'Waiting for the current tenant to confirm.',
                  state: unlock.tenantConfirmation ? 'done' : 'active',
                },
                {
                  title: 'Commission Payment',
                  body: `KES ${outgoingCommission} to the outgoing tenant after the hold period.`,
                  state: unlock.tenantConfirmation ? 'active' : 'todo',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full ${
                        item.state === 'done'
                          ? 'bg-emerald-500 text-white'
                          : item.state === 'active'
                            ? 'bg-[#28809A] text-white'
                            : 'border border-[#d8d8d8] bg-white text-[#8D9192]'
                      }`}
                    >
                      {item.state === 'done' ? 'OK' : '...'}
                    </span>
                    <span className="mt-2 h-full w-px bg-[#EDEDED]" />
                  </div>
                  <div className="pb-6">
                    <p className="font-display text-lg font-semibold text-[#252525]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#8D9192]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <p className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">Quick actions</p>
            <div className="mt-5 space-y-3">
              <button type="button" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#28809A] text-sm font-semibold text-white">
                Call
              </button>
              <button type="button" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                WhatsApp
              </button>
              <Link
                href={`/unlocks/${unlock.unlockId}/confirm`}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#EDEDED] text-sm font-semibold text-[#252525]"
              >
                Confirm Connection
              </Link>
            </div>
          </div>

          {dispute ? (
            <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-6">
              <p className="font-semibold text-[#252525]">Dispute status</p>
              <p className="mt-2 text-sm text-[#8D9192]">
                {dispute.status} / {dispute.resolution}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

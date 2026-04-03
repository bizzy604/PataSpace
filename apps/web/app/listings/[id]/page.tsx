import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPinned, ShieldCheck, UnlockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { getMockListingById } from '@/lib/mock-listings';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow={listing.neighborhood}
        title={listing.title}
        description={`${listing.description} Browse the evidence first, then decide whether to spend ${formatKes(listing.unlockCostCredits)} to reveal direct contact.`}
        actions={
          <>
            <Link
              href={`/listings/${listing.id}/gallery`}
              className={linkButtonClass({ variant: 'outline', size: 'sm' })}
            >
              View gallery
            </Link>
            <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ size: 'sm' })}>
              Unlock contact
            </Link>
          </>
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          <MetricCard
            label="Monthly rent"
            value={formatKes(listing.monthlyRent)}
            hint="Current monthly rent captured in the listing."
          />
          <MetricCard
            label="Unlock cost"
            value={formatKes(listing.unlockCostCredits)}
            hint="Calculated as 10% of the monthly rent for this listing."
            Icon={UnlockKeyhole}
          />
          <MetricCard
            label="Available from"
            value={formatDateLabel(listing.availableFrom)}
            hint={listing.availableTo ? `Lease window until ${formatDateLabel(listing.availableTo)}.` : 'No fixed end date on the current occupancy window.'}
            Icon={CalendarDays}
          />
          <MetricCard
            label="Approximate area"
            value={listing.neighborhood}
            hint="Exact address remains protected until a valid unlock."
            Icon={MapPinned}
          />
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <div className="relative h-[420px]">
                <Image
                  src={visual.hero}
                  alt={visual.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 65vw, 100vw"
                />
              </div>
              <CardContent className="grid gap-3 pt-5 sm:grid-cols-3">
                {visual.gallery.slice(1).map((image, index) => (
                  <Link
                    key={image}
                    href={`/listings/${listing.id}/gallery`}
                    className="group relative h-28 overflow-hidden rounded-[24px]"
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} preview ${index + 1}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(min-width: 640px) 200px, 100vw"
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  What you can evaluate before unlocking
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-[#62686a]">
                  The paid step is delayed until the listing already gives enough context to judge fit, location, and handover viability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                    Amenities
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.amenities.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-black/8 bg-[#f7f4ee] px-3 py-1 text-xs font-medium text-[#4b4f50]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                    Current tenant notes
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#62686a]">
                    {listing.propertyNotes}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                    Verification evidence
                  </p>
                  <div className="mt-3 grid gap-3">
                    {listing.verification.map((item) => (
                      <div
                        key={item}
                        className="rounded-[20px] border border-black/8 bg-[#fbfaf7] p-4 text-sm leading-7 text-[#4b4f50]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                      Unlock summary
                    </p>
                    <CardTitle className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                      {formatKes(listing.unlockCostCredits)}
                    </CardTitle>
                  </div>
                  <StatusBadge label={`${listing.unlockCount} prior unlocks`} tone="brand" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
                <p>
                  Unlocking reveals the exact address, tenant phone number, and
                  the contact-backed path into confirmation or dispute handling.
                </p>
                <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4">
                  <p className="font-medium text-[#252525]">Protected until unlock</p>
                  <p className="mt-2">Exact address: hidden</p>
                  <p>Phone number: hidden</p>
                  <p>Approximate map: {visual.mapLabel}</p>
                </div>
                <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ fullWidth: true })}>
                  Continue to unlock
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  Current tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-[#62686a]">
                <div className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4">
                  <p className="font-medium text-[#252525]">
                    {listing.tenant.firstName} {listing.tenant.lastName}
                  </p>
                  <p>Joined PataSpace {formatDateLabel(listing.tenant.joinedDate)}</p>
                  <p>{listing.tenant.listingsPosted} previous listings posted</p>
                </div>
                <div className="rounded-[24px] border border-black/8 bg-[#252525] p-4 text-white">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <ShieldCheck className="size-4 text-[#8ed7e7]" />
                    Contact remains protected until unlock
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    This is the paid step that keeps browse free while avoiding full-contact exposure on public listing pages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

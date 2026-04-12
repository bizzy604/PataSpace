import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Bath, BedDouble, MapPinned, ShieldCheck, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { getListingVisual } from '@/lib/listing-visuals';
import { getMockListingById } from '@/lib/mock-listings';

export function ListingDetailPage({ id }: { id: string }) {
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Listing details"
        title={listing.title}
        description="This native page replaces the Stitch listing detail screen with a full property summary, protected map preview, tenant context, and unlock call to action."
        actions={
          <>
            <Link href={`/listings/${listing.id}/gallery`} className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Open gallery
            </Link>
            <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ size: 'sm' })}>
              Unlock contact
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[36px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <div className="relative h-[420px]">
                <Image
                  src={visual.hero}
                  alt={visual.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 65vw, 100vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,37,37,0.04),rgba(37,37,37,0.42))]" />
                <div className="absolute left-6 right-6 top-6 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge label="GPS verified" tone="positive" />
                  <StatusBadge label={`${listing.unlockCount} unlocks`} tone="brand" className="bg-white/90 text-[#252525]" />
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-4">
                {visual.gallery.map((image, index) => (
                  <div key={image} className="relative h-28 overflow-hidden rounded-[20px]">
                    <Image
                      src={image}
                      alt={`${listing.title} media ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 160px, 100vw"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525]">
                    {formatKes(listing.monthlyRent)}
                    <span className="ml-2 text-base font-medium text-[#62686a]">/ month</span>
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-[#62686a]">
                    <MapPinned className="size-4 text-[#28809A]" />
                    {listing.address}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#62686a]">{listing.description}</p>
                </div>

                <div className="grid gap-3 rounded-[28px] bg-[#f7f4ee] p-5 text-sm text-[#4b4f50]">
                  <p className="inline-flex items-center gap-2">
                    <BedDouble className="size-4 text-[#28809A]" />
                    {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Bath className="size-4 text-[#28809A]" />
                    {listing.bathrooms} bathrooms
                  </p>
                  <p>Available from {formatDateLabel(listing.availableFrom)}</p>
                  <p>{listing.propertyType}</p>
                  <p>{listing.furnished ? 'Furnished' : 'Unfurnished'}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">Amenities</p>
                  <div className="grid gap-3">
                    {listing.amenities.map((item) => (
                      <div key={item} className="rounded-[20px] border border-black/8 bg-[#fbfaf7] px-4 py-3 text-sm text-[#4b4f50]">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">Verification</p>
                  <div className="grid gap-3">
                    {listing.verification.map((item) => (
                      <div key={item} className="rounded-[20px] border border-black/8 bg-[#fbfaf7] px-4 py-3 text-sm text-[#4b4f50]">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">From the current tenant</p>
                <div className="rounded-[24px] border-l-4 border-[#28809A] bg-[#f7f4ee] p-5">
                  <p className="text-sm leading-7 text-[#4b4f50]">{listing.propertyNotes}</p>
                  <p className="mt-4 font-medium text-[#252525]">
                    {listing.tenant.firstName} {listing.tenant.lastName}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
              <CardContent className="space-y-5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">Unlock summary</p>
                <p className="font-display text-4xl font-semibold tracking-[-0.07em]">{formatKes(listing.unlockCostCredits)}</p>
                <p className="text-sm leading-7 text-white/76">
                  Unlock pricing follows the marketplace rule of 10% of monthly rent. The paid reveal includes the phone number, full address, and GPS coordinates.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ size: 'sm' })}>
                    Reveal contact
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                    <Wallet className="size-4" />
                    Review wallet
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">Location preview</p>
                <div className="rounded-[28px] border border-black/8 bg-[radial-gradient(circle_at_top,rgba(40,128,154,0.14),transparent_38%),linear-gradient(180deg,#eef2ee_0%,#dce4da_100%)] p-6">
                  <p className="font-medium text-[#252525]">{visual.mapLabel}</p>
                  <p className="mt-3 text-sm leading-7 text-[#62686a]">
                    Exact address and direct coordinates remain hidden until unlock, but the approximate area and transport context are visible first.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardContent className="space-y-4 p-6">
                <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                  <ShieldCheck className="size-4 text-[#28809A]" />
                  Before you unlock
                </p>
                <div className="space-y-3 text-sm leading-7 text-[#4b4f50]">
                  <p>Review gallery media and tenant notes first.</p>
                  <p>Unlock once only when the listing feels worth pursuing.</p>
                  <p>Use the follow-through routes for confirmation or disputes after contact is revealed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

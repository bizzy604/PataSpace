import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Grid2X2, MapPinned, ShieldCheck } from 'lucide-react';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { getMockListingById } from '@/lib/mock-listings';

type ListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);

  return (
    <section className="bg-[#EDEDED]">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/listings" className="text-sm font-medium text-[#8D9192] transition-colors hover:text-[#252525]">
            Back to listings
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,840px)_360px]">
          <div className="space-y-6">
            <div className="rounded-[24px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <div className="relative aspect-[3/2] overflow-hidden rounded-[20px]">
                <Image
                  src={visual.hero}
                  alt={visual.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1280px) 840px, 100vw"
                />
                <div className="absolute bottom-4 right-4">
                  <Link
                    href={`/listings/${listing.id}/gallery`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#28809A]/90 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Grid2X2 className="size-4" />
                    View All {visual.gallery.length} Photos
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {visual.gallery.map((image, index) => (
                  <div
                    key={image}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${
                      index === 0 ? 'border-[3px] border-[#28809A]' : 'border border-[#d8d8d8]'
                    }`}
                  >
                    <Image src={image} alt={`${listing.title} thumbnail ${index + 1}`} fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <p className="font-display text-4xl font-bold tracking-[-0.05em] text-[#28809A]">
                {formatKes(listing.monthlyRent)}/mo
              </p>
              <p className="mt-3 text-lg text-[#252525]">
                {listing.address}, {listing.neighborhood}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  `${listing.bedrooms} bedrooms`,
                  `${listing.bathrooms} bathroom`,
                  listing.propertyType,
                  '850 sq ft',
                ].map((item) => (
                  <span key={item} className="rounded-full bg-[#EDEDED] px-4 py-2 text-sm text-[#8D9192]">
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-base text-[#8D9192]">Available from {formatDateLabel(listing.availableFrom)}</p>
            </div>

            <div className="sticky top-20 z-10 rounded-[20px] border border-[#EDEDED] bg-white px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <div className="flex flex-wrap gap-6 text-sm font-medium text-[#8D9192]">
                <span className="border-b-[3px] border-[#28809A] pb-3 font-display font-semibold text-[#252525]">Overview</span>
                <span className="pb-3">Amenities</span>
                <span className="pb-3">Location</span>
                <span className="pb-3">Reviews</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">Overview</h2>
                <p className="mt-5 text-base leading-8 text-[#8D9192]">{listing.description}</p>
                <p className="mt-5 text-base leading-8 text-[#8D9192]">{listing.propertyNotes}</p>
              </div>

              <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">Amenities</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {listing.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-start gap-3 text-base text-[#252525]">
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                        <Check className="size-3.5" />
                      </span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border-l-4 border-[#28809A] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">From the tenant</h2>
                <p className="mt-5 text-lg italic leading-8 text-[#8D9192]">
                  {listing.propertyNotes ?? 'The listing is documented with enough detail that you can decide before travelling.'}
                </p>
                <p className="mt-4 text-sm text-[#8D9192]">Current tenant / moving soon</p>
              </div>

              <div className="rounded-[24px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">Location</h2>
                <div className="mt-6 overflow-hidden rounded-[20px]">
                  <div
                    className="flex h-[400px] items-center justify-center bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(37,37,37,0.16), rgba(37,37,37,0.34)), url(${visual.gallery[1] ?? visual.hero})` }}
                  >
                    <div className="rounded-[18px] bg-white/92 px-5 py-4 text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                      <MapPinned className="mx-auto size-6 text-[#28809A]" />
                      <p className="mt-3 text-sm font-semibold text-[#252525]">Exact address revealed after unlock</p>
                      <p className="mt-1 text-sm text-[#8D9192]">{visual.mapLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-[24px] border-2 border-[#28809A] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <p className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">Unlock Contact Information</p>
              <p className="mt-5 font-display text-5xl font-bold tracking-[-0.05em] text-[#28809A]">
                {formatKes(listing.unlockCostCredits)}
              </p>
              <p className="mt-2 text-sm text-[#8D9192]">About 10% of monthly rent</p>

              <div className="mt-6 border-t border-[#EDEDED] pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">What you get</p>
                <div className="mt-4 space-y-3">
                  {['Tenant phone number', 'Exact address', 'GPS coordinates', 'WhatsApp contact'].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-[#252525]">
                      <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-[#28809A]/12 text-[#28809A]">
                        <Check className="size-3.5" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/listings/${listing.id}/unlock`}
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#28809A] px-6 text-sm font-semibold text-white"
              >
                Unlock Now
              </Link>
              <p className="mt-4 text-center text-xs text-[#8D9192]">Your balance: KES 6,400</p>
            </div>

            <div className="rounded-[18px] border border-[#28809A] bg-[#28809A]/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-[#28809A]" />
                <div>
                  <p className="text-sm font-semibold text-[#28809A]">Full refund if the documented rejection path applies</p>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-[#fafafa] p-5">
              <p className="text-sm font-semibold text-[#252525]">GPS Verified</p>
              <p className="mt-2 text-sm leading-6 text-[#8D9192]">Photos and listing context are tied to the approximate location before unlock.</p>
            </div>

            <div className="rounded-[18px] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <p className="text-sm font-semibold text-[#252525]">Listing Stats</p>
              <div className="mt-4 space-y-3 text-sm text-[#8D9192]">
                <div className="flex justify-between">
                  <span>Views</span>
                  <span>{listing.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unlocks</span>
                  <span>{listing.unlockCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Listed</span>
                  <span>3 days ago</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

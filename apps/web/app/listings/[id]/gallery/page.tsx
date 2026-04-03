import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { getMockListingById } from '@/lib/mock-listings';
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
        eyebrow="Photo gallery"
        title={`Walk through ${listing.title}`}
        description="The full gallery stays visible before purchase so incoming tenants can evaluate space, layout, and proof of occupancy before deciding to unlock."
        actions={
          <>
            <Link
              href={`/listings/${listing.id}`}
              className={linkButtonClass({ variant: 'outline', size: 'sm' })}
            >
              Back to listing
            </Link>
            <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ size: 'sm' })}>
              Unlock contact
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <div className="relative h-[460px] overflow-hidden rounded-[36px] border border-black/8 shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <Image
              src={visual.gallery[0]}
              alt={visual.alt}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {visual.gallery.map((image, index) => (
              <div
                key={image}
                className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_20px_60px_rgba(37,37,37,0.08)]"
              >
                <div className="relative h-64">
                  <Image
                    src={image}
                    alt={`${listing.title} gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">
                    {listing.media[index]?.title ?? `Frame ${index + 1}`}
                  </p>
                  <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">
                    {listing.media[index]?.gpsTag ?? visual.neighborhoodTag}
                  </p>
                  <p className="text-sm leading-7 text-[#62686a]">
                    {listing.media[index]?.caption ?? 'Media evidence approved before publishing.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

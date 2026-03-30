import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/shared/page-intro';
import { MediaTile } from '@/components/shared/media-tile';
import { linkButtonVariants } from '@/lib/link-button';
import { getMockListingById } from '@/lib/mock-listings';

type ListingGalleryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingGalleryPage({ params }: ListingGalleryPageProps) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        badge="Photo gallery"
        kicker={listing.title}
        title="Review the uploaded media before you unlock."
        description="The mobile capture flow provides the media evidence. The web gallery gives the incoming tenant a clearer pre-visit review surface."
        actions={
          <>
            <Link href={`/listings/${listing.id}`} className={linkButtonVariants({ variant: 'outline' })}>
              Back to listing
            </Link>
            <Link href={`/listings/${listing.id}/unlock`} className={linkButtonVariants()}>
              Continue to unlock
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listing.media.map((item) => (
          <MediaTile
            key={item.id}
            title={item.title}
            caption={item.caption}
            tone={item.tone}
            gpsTag={item.gpsTag}
            className="min-h-[320px]"
          />
        ))}
      </div>
    </section>
  );
}

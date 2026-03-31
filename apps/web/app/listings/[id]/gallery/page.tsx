import { notFound } from 'next/navigation';
import { LightboxGallery } from '@/components/listings/lightbox-gallery';
import { getListingVisual } from '@/lib/listing-visuals';
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

  const visual = getListingVisual(listing.id);

  return (
    <LightboxGallery
      title={listing.title}
      images={visual.gallery}
      alt={visual.alt}
      backHref={`/listings/${listing.id}`}
    />
  );
}

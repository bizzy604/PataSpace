import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPinned } from 'lucide-react';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { MockListing } from '@/lib/mock-listings';

type ListingCardProps = {
  listing: MockListing;
};

export function ListingCard({ listing }: ListingCardProps) {
  const visual = getListingVisual(listing.id);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#EDEDED] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#28809A]">
      <div className="relative h-[220px] overflow-hidden">
        <Image
          src={visual.hero}
          alt={visual.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,37,37,0.08),rgba(37,37,37,0.5))]" />
        <div className="absolute left-0 top-0 rounded-br-[16px] bg-[#28809A] px-4 py-2 text-sm font-semibold text-white">
          {formatKes(listing.monthlyRent)}/mo
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-[#252525]">
          <span className="inline-flex size-2 rounded-full bg-emerald-500" />
          Available
        </div>
        <button
          type="button"
          aria-label={`Save ${listing.title}`}
          className="absolute bottom-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/92 text-[#8D9192] transition-colors hover:text-[#28809A]"
        >
          <Heart className="size-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="font-display text-[22px] font-bold tracking-[-0.04em] text-[#28809A]">
            {formatKes(listing.monthlyRent)}/mo
          </p>
          <div className="mt-2 flex items-center gap-2 text-[15px] text-[#252525]">
            <MapPinned className="size-4 text-[#28809A]" />
            <span>
              {listing.neighborhood}, {listing.county}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8D9192]">
            {listing.bedrooms} bed / {listing.bathrooms} bath / {listing.propertyType}
          </p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#8D9192]">{listing.description}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8D9192]">
          <span>
            {listing.viewCount} views / {listing.unlockCount} unlocks
          </span>
          <span>Available {formatDateLabel(listing.availableFrom)}</span>
        </div>

        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#28809A] px-5 text-sm font-semibold text-white opacity-100 transition-colors hover:bg-[#236f86] md:opacity-0 md:group-hover:opacity-100"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

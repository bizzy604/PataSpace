/**
 * Purpose: Listing preview card — compact browse tile for a single ListingCard.
 * Why important: The primary unit in the listings grid; must render from API contract types.
 * Used by: listings browse page, discovery search results.
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bath, BedDouble, MapPinned } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateLabel, formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';
import type { ListingCard } from '@pataspace/contracts';

function bedroomLabel(bedrooms: number) {
  return bedrooms === 0 ? 'Studio' : `${bedrooms} bed`;
}

export function ListingPreviewCard({ listing }: { listing: ListingCard }) {
  const visual = getListingVisual(listing.id);
  const title = listing.bedrooms === 0 ? `Studio · ${listing.neighborhood}` : `${listing.bedrooms}BR · ${listing.neighborhood}`;

  return (
    <Card className="overflow-hidden border border-black/8 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
      <div className="relative h-60 overflow-hidden">
        <Image
          src={listing.thumbnailUrl ?? visual.hero}
          alt={visual.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,37,37,0.04),rgba(37,37,37,0.42))]" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <StatusBadge label="Available" tone="positive" />
          <StatusBadge label={`${listing.unlockCount} unlocks`} tone="brand" className="bg-white/90 text-[#252525]" />
        </div>
      </div>

      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <p className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
            {formatKes(listing.monthlyRent)}
            <span className="ml-2 text-base font-medium text-[#62686a]">/ month</span>
          </p>
          <h2 className="font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">{title}</h2>
          <p className="flex items-center gap-2 text-sm text-[#62686a]">
            <MapPinned className="size-4 text-[#28809A]" />{listing.county}
          </p>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-black/8 bg-[#f8fafc] p-4 text-sm text-[#4b4f50] sm:grid-cols-3">
          <p className="inline-flex items-center gap-2"><BedDouble className="size-4 text-[#28809A]" />{bedroomLabel(listing.bedrooms)}</p>
          <p className="inline-flex items-center gap-2"><Bath className="size-4 text-[#28809A]" />{listing.bathrooms} bath</p>
          <p>Available {formatDateLabel(listing.availableFrom)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/listings/${listing.id}`} className={linkButtonClass({ size: 'sm' })}>
            View details <ArrowRight className="size-4" />
          </Link>
          <Link href={`/listings/${listing.id}/unlock`} className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Unlock contact
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

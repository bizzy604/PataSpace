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
    <Card className="overflow-hidden border border-border bg-card shadow-sm">
      <div className="relative h-60 overflow-hidden">
        <Image
          src={listing.thumbnailUrl ?? visual.hero}
          alt={visual.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.5))]" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <StatusBadge label="Available" tone="positive" />
          <StatusBadge label={`${listing.unlockCount} unlocks`} tone="brand" className="bg-card/90" />
        </div>
      </div>

      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <p className="text-3xl font-semibold text-foreground">
            {formatKes(listing.monthlyRent)}
            <span className="ml-2 text-base font-medium text-muted-foreground">/ month</span>
          </p>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinned className="size-4 text-primary" />{listing.county}
          </p>
        </div>

        <div className="grid gap-3 border border-border bg-muted p-4 text-sm text-foreground sm:grid-cols-3">
          <p className="inline-flex items-center gap-2"><BedDouble className="size-4 text-primary" />{bedroomLabel(listing.bedrooms)}</p>
          <p className="inline-flex items-center gap-2"><Bath className="size-4 text-primary" />{listing.bathrooms} bath</p>
          <p className="text-muted-foreground">Available {formatDateLabel(listing.availableFrom)}</p>
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

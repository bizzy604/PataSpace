import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaTile } from '@/components/shared/media-tile';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { MockListing } from '@/lib/mock-listings';

type ListingCardProps = {
  listing: MockListing;
};

export function ListingCard({ listing }: ListingCardProps) {
  const heroMedia = listing.media[0];

  return (
    <Card className="mt-5 overflow-hidden bg-surface-elevated shadow-soft-md">
      <div className="px-5 pt-5">
        <MediaTile
          title={heroMedia.title}
          caption={heroMedia.caption}
          tone={heroMedia.tone}
          gpsTag={heroMedia.gpsTag}
          className="min-h-[260px]"
        />
      </div>

      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="section-kicker">{listing.county}</p>
            <CardTitle className="mt-3 text-[1.65rem] sm:text-[1.9rem]">
              {listing.title}
            </CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{listing.neighborhood}</Badge>
              <Badge variant="secondary">{listing.propertyType}</Badge>
              <Badge variant="outline">{listing.bedrooms} bedroom</Badge>
              <Badge variant="outline">Available {formatDateLabel(listing.availableFrom)}</Badge>
            </div>
          </div>
          <Badge className="h-auto px-4 py-2 text-sm tracking-[0.12em]">
            Unlock {formatKes(listing.unlockCostCredits)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 text-foreground-secondary md:grid-cols-4">
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          {formatKes(listing.monthlyRent)} / month
        </p>
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          {listing.bedrooms} bed • {listing.bathrooms} bath
        </p>
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          {listing.viewCount} views • {listing.unlockCount} unlocks
        </p>
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          {listing.tenant.firstName} has posted {listing.tenant.listingsPosted} verified listing(s)
        </p>
      </CardContent>

      <CardFooter className="justify-between gap-4">
        <p className="max-w-xl text-sm text-foreground-secondary">{listing.description}</p>
        <Link
          href={`/listings/${listing.id}`}
          className={linkButtonVariants({ size: 'sm' })}
        >
          View details
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

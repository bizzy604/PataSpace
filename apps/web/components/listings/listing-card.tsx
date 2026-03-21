import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MockListing } from '@/lib/mock-listings';

type ListingCardProps = {
  listing: Pick<
    MockListing,
    'id' | 'title' | 'neighborhood' | 'monthlyRent' | 'bedrooms' | 'unlockCostCredits'
  >;
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-[-0.03em]">
            {listing.title}
          </CardTitle>
          <div className="mt-3 flex gap-2">
            <Badge variant="outline">{listing.neighborhood}</Badge>
            <Badge variant="secondary">{listing.bedrooms} bedroom(s)</Badge>
          </div>
        </div>
        <Badge className="h-auto px-4 py-2 text-sm tracking-[0.12em]">
          Unlock {listing.unlockCostCredits.toLocaleString()} credits
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-3 text-foreground-secondary sm:grid-cols-3">
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          KES {listing.monthlyRent.toLocaleString()} / month
        </p>
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          Verified listing flow ready
        </p>
        <p className="rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
          Contact reveal after unlock
        </p>
      </CardContent>

      <CardFooter className="justify-between">
        <p className="text-sm text-foreground-secondary">Photos, video, and GPS verification</p>
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition hover:bg-[var(--hig-color-accent-hover)]"
        >
          View details
        </Link>
      </CardFooter>
    </Card>
  );
}

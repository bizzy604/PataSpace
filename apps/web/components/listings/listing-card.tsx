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
    <Card className="mt-4 border-stone-300/80 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-bold tracking-tight text-stone-950">
            {listing.title}
          </CardTitle>
          <div className="mt-3 flex gap-2">
            <Badge variant="outline">{listing.neighborhood}</Badge>
            <Badge variant="secondary">{listing.bedrooms} bedroom(s)</Badge>
          </div>
        </div>
        <Badge className="h-auto rounded-full px-4 py-2 text-sm font-semibold">
          Unlock {listing.unlockCostCredits.toLocaleString()} credits
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-3 text-stone-700 sm:grid-cols-3">
        <p className="rounded-2xl bg-muted px-4 py-3">
          KES {listing.monthlyRent.toLocaleString()} / month
        </p>
        <p className="rounded-2xl bg-muted px-4 py-3">Verified listing flow ready</p>
        <p className="rounded-2xl bg-muted px-4 py-3">Contact reveal after unlock</p>
      </CardContent>

      <CardFooter className="justify-between">
        <p className="text-sm text-muted-foreground">Photos, video, and GPS verification</p>
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          View details
        </Link>
      </CardFooter>
    </Card>
  );
}

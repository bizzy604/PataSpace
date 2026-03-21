import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-6">
        <Link
          href="/listings"
          className="text-sm font-medium text-foreground-secondary transition hover:text-foreground"
        >
          Back to listings
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.county}</Badge>
              <Badge variant="outline">{listing.neighborhood}</Badge>
              <Badge variant="outline">Available {listing.availableFrom}</Badge>
            </div>
            <div>
              <CardTitle className="text-4xl font-semibold tracking-[-0.05em]">
                {listing.title}
              </CardTitle>
              <CardDescription className="mt-3 max-w-3xl text-base leading-7">
                {listing.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
                KES {listing.monthlyRent.toLocaleString()} / month
              </div>
              <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
                {listing.bedrooms} bedroom(s), {listing.bathrooms} bathroom(s)
              </div>
              <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
                Unlock cost {listing.unlockCostCredits.toLocaleString()} credits
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-separator bg-surface-subtle shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg">Amenities</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {listing.amenities.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-separator bg-surface-subtle shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg">Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-foreground-secondary">
                  {listing.verification.map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-surface-elevated shadow-soft-md">
            <CardHeader>
              <CardTitle>Unlock this listing</CardTitle>
              <CardDescription>
                Incoming tenants browse for free and spend credits only when they want
                the real contact and location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground-secondary">
              <div className="flex items-center justify-between rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
                <span>Unlock fee</span>
                <span className="font-semibold">
                  {listing.unlockCostCredits.toLocaleString()} credits
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
                <span>What gets revealed</span>
                <span className="font-semibold">Phone, address, GPS</span>
              </div>
              <div className="flex items-center justify-between rounded-[22px] border border-separator bg-fill-soft px-4 py-3">
                <span>Refund path</span>
                <span className="font-semibold">Admin-reviewed disputes</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <Button>Unlock contact info</Button>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center justify-center rounded-full border border-separator bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                Sign in to continue
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenant profile</CardTitle>
              <CardDescription>
                {listing.tenant.firstName} joined on {listing.tenant.joinedDate} and has
                posted {listing.tenant.listingsPosted} verified listing(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-foreground-secondary">
              Contact details stay hidden until unlock. Confirmation and payout steps
              happen after both parties verify the connection.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

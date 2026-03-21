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
        <Link href="/listings" className="text-sm font-medium text-stone-600 hover:text-stone-950">
          Back to listings
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-stone-300/80 bg-white/85 shadow-sm backdrop-blur">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.county}</Badge>
              <Badge variant="outline">{listing.neighborhood}</Badge>
              <Badge variant="outline">Available {listing.availableFrom}</Badge>
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight text-stone-950">
                {listing.title}
              </CardTitle>
              <CardDescription className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
                {listing.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm text-stone-700">
                KES {listing.monthlyRent.toLocaleString()} / month
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm text-stone-700">
                {listing.bedrooms} bedroom(s), {listing.bathrooms} bathroom(s)
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm text-stone-700">
                Unlock cost {listing.unlockCostCredits.toLocaleString()} credits
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-stone-200 bg-stone-50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Amenities</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {listing.amenities.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-stone-200 bg-stone-50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-stone-700">
                  {listing.verification.map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-stone-300/80 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Unlock this listing</CardTitle>
              <CardDescription>
                Incoming tenants browse for free and spend credits only when they want the real contact and location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-700">
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span>Unlock fee</span>
                <span className="font-semibold">{listing.unlockCostCredits.toLocaleString()} credits</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span>What gets revealed</span>
                <span className="font-semibold">Phone, address, GPS</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span>Refund path</span>
                <span className="font-semibold">Admin-reviewed disputes</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <Button>Unlock contact info</Button>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-muted"
              >
                Sign in to continue
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-stone-300/80 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Tenant profile</CardTitle>
              <CardDescription>
                {listing.tenant.firstName} joined on {listing.tenant.joinedDate} and has posted{' '}
                {listing.tenant.listingsPosted} verified listing(s).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-stone-700">
              Contact details stay hidden until unlock. Confirmation and payout steps happen after both parties verify the connection.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

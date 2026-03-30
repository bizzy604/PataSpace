import Link from 'next/link';
import { ArrowRight, MapPinned, ShieldCheck, Unlock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyStat } from '@/components/shared/key-stat';
import { MediaTile } from '@/components/shared/media-tile';
import { PageIntro } from '@/components/shared/page-intro';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
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
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-6">
        <Link
          href="/listings"
          className="text-sm font-medium text-foreground-secondary transition hover:text-foreground"
        >
          Back to listings
        </Link>
      </div>

      <PageIntro
        badge="Listing detail"
        kicker={`${listing.county} • ${listing.neighborhood}`}
        title={listing.title}
        description={listing.description}
        actions={
          <>
            <Link href={`/listings/${listing.id}/gallery`} className={linkButtonVariants({ variant: 'outline' })}>
              Open gallery
            </Link>
            <Link href={`/listings/${listing.id}/unlock`} className={linkButtonVariants()}>
              Unlock contact
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <MediaTile
              title={listing.media[0].title}
              caption={listing.media[0].caption}
              tone={listing.media[0].tone}
              gpsTag={listing.media[0].gpsTag}
              className="md:min-h-[420px]"
            />
            <div className="grid gap-4">
              {listing.media.slice(1).map((item) => (
                <MediaTile
                  key={item.id}
                  title={item.title}
                  caption={item.caption}
                  tone={item.tone}
                  gpsTag={item.gpsTag}
                  className="min-h-[198px]"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KeyStat label="Rent" value={`${formatKes(listing.monthlyRent)} / mo`} />
            <KeyStat label="Unlock cost" value={formatKes(listing.unlockCostCredits)} />
            <KeyStat label="Views" value={`${listing.viewCount}`} />
            <KeyStat label="Unlocks" value={`${listing.unlockCount}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pb-5">
                {listing.amenities.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-5 text-sm leading-6 text-foreground-secondary">
                {listing.verification.map((item) => (
                  <p key={item}>• {item}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Property notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-5 text-sm leading-7 text-foreground-secondary">
              <p>{listing.propertyNotes}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{listing.propertyType}</Badge>
                <Badge variant="outline">{listing.furnished ? 'Furnished' : 'Unfurnished'}</Badge>
                <Badge variant="outline">Available {formatDateLabel(listing.availableFrom)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-[#252525] text-white shadow-soft-lg">
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-[#67d1e3]">
                <Unlock className="size-5" />
              </div>
              <CardTitle className="text-white">Unlock this listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-5 text-sm text-white/76">
              <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                <span>Unlock fee</span>
                <span className="font-semibold text-white">{formatKes(listing.unlockCostCredits)}</span>
              </div>
              <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                <span>Reveal after payment</span>
                <span className="font-semibold text-white">Phone, address, GPS</span>
              </div>
              <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                <span>Support path</span>
                <span className="font-semibold text-white">Dispute if needed</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/listings/${listing.id}/unlock`} className={linkButtonVariants()}>
                  Continue to unlock
                </Link>
                <Link href="/auth/sign-in" className={linkButtonVariants({ variant: 'outline' })}>
                  Sign in first
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Current tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-5 text-sm leading-7 text-foreground-secondary">
              <p>
                {listing.tenant.firstName} joined on {formatDateLabel(listing.tenant.joinedDate)} and has posted {listing.tenant.listingsPosted} verified listing(s).
              </p>
              <div className="rounded-[24px] border border-separator bg-fill-soft px-4 py-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-4 text-primary" />
                  <p>
                    Contact details stay hidden until unlock. After that, you can confirm the connection and use the dispute flow if the documented policy applies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Area preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-5 text-sm leading-7 text-foreground-secondary">
              <div className="rounded-[28px] border border-separator bg-fill-soft px-5 py-6">
                <div className="flex items-center gap-3 text-foreground">
                  <MapPinned className="size-5 text-primary" />
                  <span className="font-semibold">{listing.address}</span>
                </div>
                <p className="mt-3">
                  Approx map point: {listing.mapLocation.approxLatitude}, {listing.mapLocation.approxLongitude}
                </p>
              </div>
              <Link href={`/listings/${listing.id}/gallery`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Review media and GPS snapshots
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

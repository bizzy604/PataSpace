/**
 * Purpose: Listing detail page — renders full property information from a fetched ListingDetails record.
 * Why important: Central browse-to-unlock screen; must render correctly for both authenticated and guest users.
 * Used by: app/listings/[id]/page.tsx (server-fetched data passed as prop).
 */
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Bath, BedDouble, LogIn, MapPinned, ShieldCheck, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { getListingVisual } from '@/lib/listing-visuals';
import type { ListingDetails } from '@pataspace/contracts';

function composeTitle(listing: ListingDetails): string {
  const bed = listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms}BR`;
  return `${bed} ${listing.neighborhood}`;
}

export function ListingDetailPage({
  listing,
  isAuthenticated,
}: {
  listing: ListingDetails | null;
  isAuthenticated: boolean;
}) {
  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);
  const title = composeTitle(listing);
  const unlockHref = isAuthenticated
    ? `/listings/${listing.id}/unlock`
    : `/auth/sign-in?redirect_url=/listings/${listing.id}/unlock`;

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Listing details"
        title={title}
        description="Full property summary with protected map preview, tenant context, and unlock call to action."
        actions={
          <>
            <Link href={`/listings/${listing.id}/gallery`} className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Open gallery
            </Link>
            <Link href={unlockHref} className={linkButtonClass({ size: 'sm' })}>
              {isAuthenticated ? 'Unlock contact' : 'Sign in to unlock'}
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative h-[420px]">
                <Image src={visual.hero} alt={visual.alt} fill className="object-cover" sizes="(min-width: 1280px) 65vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute left-6 right-6 top-6 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge label="GPS verified" tone="positive" />
                  <StatusBadge label={`${listing.unlockCount} unlocks`} tone="brand" className="bg-card/90 backdrop-blur-sm" />
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-4">
                {(listing.photos.length > 0 ? listing.photos.slice(0, 4) : visual.gallery.slice(0, 4)).map((photo, index) => (
                  <div
                    key={typeof photo === 'string' ? photo : photo.url}
                    className="relative h-28 overflow-hidden rounded-lg border border-border"
                  >
                    <Image
                      src={typeof photo === 'string' ? photo : photo.url}
                      alt={`${title} photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-4xl font-semibold text-foreground">
                    {formatKes(listing.monthlyRent)}
                    <span className="ml-2 text-base font-medium text-muted-foreground">/ month</span>
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinned className="size-4 text-primary" />
                    {listing.contactInfo?.address ?? listing.neighborhood}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{listing.description}</p>
                </div>
                <div className="grid gap-3 rounded-lg bg-muted/60 p-5 text-sm text-foreground">
                  <p className="inline-flex items-center gap-2"><BedDouble className="size-4 text-primary" />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedrooms`}</p>
                  <p className="inline-flex items-center gap-2"><Bath className="size-4 text-primary" />{listing.bathrooms} bathrooms</p>
                  <p className="text-muted-foreground">Available from {formatDateLabel(listing.availableFrom)}</p>
                  <p className="text-muted-foreground">{listing.propertyType}</p>
                  <p className="text-muted-foreground">{listing.furnished ? 'Furnished' : 'Unfurnished'}</p>
                </div>
              </CardContent>
            </Card>

            {listing.amenities.length > 0 && (
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Amenities</p>
                  <div className="grid gap-3">
                    {listing.amenities.map((item) => (
                      <div key={item} className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-foreground">{item}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {listing.propertyNotes && (
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">From the current tenant</p>
                  <div className="rounded-lg border-l-4 border-l-primary bg-muted/60 p-5">
                    <p className="text-sm leading-7 text-foreground">{listing.propertyNotes}</p>
                    <p className="mt-4 font-medium text-foreground">{listing.tenant.firstName}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
              <CardContent className="space-y-5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">Unlock summary</p>
                <p className="text-4xl font-bold">{formatKes(listing.unlockCostCredits)}</p>
                <p className="text-sm leading-7 text-primary-foreground/80">
                  Unlock pricing follows the marketplace rule of 10% of monthly rent. The paid reveal includes the phone number, full address, and GPS coordinates.
                </p>
                {isAuthenticated ? (
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/listings/${listing.id}/unlock`} className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md">
                      Reveal contact <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/wallet" className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10">
                      <Wallet className="size-4" /> Check wallet
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href={unlockHref} className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md">
                      <LogIn className="size-4" /> Sign in to unlock
                    </Link>
                    <p className="text-xs text-primary-foreground/60">Free to browse — sign in only when you want to reveal contact details.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Location preview</p>
                <div className="rounded-lg bg-muted/60 p-6">
                  <p className="font-medium text-foreground">{visual.mapLabel}</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Exact address and GPS coordinates remain hidden until unlock.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="space-y-4 p-6">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary" /> Before you unlock
                </p>
                <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>Review gallery media and tenant notes first.</p>
                  <p>Unlock once only when the listing feels worth pursuing.</p>
                  <p>Use the follow-through routes for confirmation or disputes after contact is revealed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

import Link from 'next/link';
import { MapPinned, Navigation, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { mockListings } from '@/lib/mock-listings';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

function markerStyle(latitude: number, longitude: number) {
  const latitudes = mockListings.map((listing) => listing.mapLocation.approxLatitude);
  const longitudes = mockListings.map((listing) => listing.mapLocation.approxLongitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const top = 12 + ((maxLat - latitude) / Math.max(maxLat - minLat, 0.0001)) * 68;
  const left = 14 + ((longitude - minLng) / Math.max(maxLng - minLng, 0.0001)) * 68;

  return { top: `${top}%`, left: `${left}%` };
}

export default function Page() {
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Map view"
        title="Approximate map preview before unlock"
        description="Map pins reveal the area context for each listing without exposing the exact address. Exact location stays protected until the paid unlock step."
        actions={
          <>
            <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
              Browse listings
            </Link>
            <Link href="/search" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Search listings
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Nairobi area map
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                A simplified map surface showing approximate neighborhoods only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[520px] overflow-hidden rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,#f7f4ee,#eef4f5)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(40,128,154,0.12),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(40,128,154,0.1),transparent_24%)]" />
                <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(37,37,37,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(37,37,37,0.07)_1px,transparent_1px)] [background-size:52px_52px]" />
                <div className="absolute left-[10%] top-[14%] rounded-full bg-white/82 px-4 py-2 text-sm font-medium text-[#252525] shadow-soft-sm">
                  Westlands
                </div>
                <div className="absolute left-[43%] top-[40%] rounded-full bg-white/82 px-4 py-2 text-sm font-medium text-[#252525] shadow-soft-sm">
                  Kilimani
                </div>
                <div className="absolute left-[60%] top-[58%] rounded-full bg-white/82 px-4 py-2 text-sm font-medium text-[#252525] shadow-soft-sm">
                  South B
                </div>

                {mockListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group absolute"
                    style={markerStyle(listing.mapLocation.approxLatitude, listing.mapLocation.approxLongitude)}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-[#28809A] text-white shadow-[0_16px_34px_rgba(40,128,154,0.28)] transition group-hover:scale-105">
                      <MapPinned className="size-5" />
                    </span>
                    <span className="mt-2 block rounded-full bg-white/94 px-3 py-1 text-xs font-medium text-[#252525] shadow-soft-sm">
                      {listing.neighborhood}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
                  Map behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/76">
                <p className="inline-flex items-center gap-2 font-medium text-white">
                  <ShieldCheck className="size-4 text-[#8ed7e7]" />
                  Exact address stays hidden
                </p>
                <p>Map view helps renters judge neighborhood fit before paying.</p>
                <p>Unlock is still the step that reveals the exact address and direct phone contact.</p>
              </CardContent>
            </Card>

            {mockListings.map((listing) => (
              <Card
                key={listing.id}
                className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]"
              >
                <CardContent className="space-y-3 p-5">
                  <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">
                    {listing.title}
                  </p>
                  <p className="text-sm text-[#62686a]">
                    {listing.neighborhood} • {formatKes(listing.monthlyRent)}
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm text-[#62686a]">
                    <Navigation className="size-4 text-[#28809A]" />
                    Approximate location only until unlock
                  </p>
                  <Link href={`/listings/${listing.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-[#28809A]">
                    View listing
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

import Link from 'next/link';
import { ArrowRight, Filter, ShieldCheck, Wallet } from 'lucide-react';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { MetricCard } from '@/components/shared/metric-card';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { mockListings } from '@/lib/mock-listings';
import { formatKes } from '@/lib/format';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesBedroomFilter(bedrooms: number, filter?: string) {
  if (!filter) {
    return true;
  }

  if (filter === 'Bedsitter') {
    return bedrooms === 0;
  }

  const count = Number.parseInt(filter, 10);
  return Number.isNaN(count) ? true : bedrooms === count;
}

function matchesPriceFilter(monthlyRent: number, filter?: string) {
  if (!filter) {
    return true;
  }

  if (filter === 'KES 10k - 20k') {
    return monthlyRent >= 10000 && monthlyRent <= 20000;
  }

  if (filter === 'KES 20k - 50k') {
    return monthlyRent >= 20000 && monthlyRent <= 50000;
  }

  if (filter === 'KES 50k - 80k') {
    return monthlyRent >= 50000 && monthlyRent <= 80000;
  }

  if (filter === 'KES 80k+') {
    return monthlyRent >= 80000;
  }

  return true;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const location = firstValue(params.location);
  const bedrooms = firstValue(params.bedrooms);
  const price = firstValue(params.price);

  const filteredListings = mockListings.filter((listing) => {
    const matchesLocation = location ? listing.neighborhood === location : true;
    return (
      matchesLocation &&
      matchesBedroomFilter(listing.bedrooms, bedrooms) &&
      matchesPriceFilter(listing.monthlyRent, price)
    );
  });

  const averageUnlockCost = Math.round(
    filteredListings.reduce((sum, listing) => sum + listing.unlockCostCredits, 0) /
      Math.max(filteredListings.length, 1),
  );

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Browse listings"
        title="Discover verified homes before you spend a credit"
        description={`Showing ${filteredListings.length} listings across Nairobi. Browse stays free, then unlock direct contact only when a listing feels worth pursuing.`}
        actions={
          <>
            <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              <Wallet className="size-4" />
              Wallet
            </Link>
            <Link href="/auth/sign-in" className={linkButtonClass({ size: 'sm' })}>
              Continue to sign in
              <ArrowRight className="size-4" />
            </Link>
          </>
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <MetricCard
            label="Results"
            value={`${filteredListings.length}`}
            hint="Listings that match the current browse context from the landing search."
            Icon={Filter}
          />
          <MetricCard
            label="Typical unlock"
            value={formatKes(averageUnlockCost)}
            hint="Unlock cost follows the 10% of monthly rent rule documented for the marketplace."
            Icon={Wallet}
          />
          <MetricCard
            label="Verification"
            value="GPS-backed"
            hint="Mock listings include approved media, timestamps, and approximate map previews before contact reveal."
            Icon={ShieldCheck}
          />
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_2.05fr]">
          <div className="space-y-6 rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#28809A]">
                Current filters
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  location ? `Area: ${location}` : 'Area: Any',
                  bedrooms ? `Bedrooms: ${bedrooms}` : 'Bedrooms: Any',
                  price ? `Budget: ${price}` : 'Budget: Any',
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-black/8 bg-[#f7f4ee] px-3 py-1 text-xs font-medium text-[#4b4f50]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                Explore fast-moving neighborhoods
              </p>
              <div className="mt-4 grid gap-3">
                {neighborhoodSearchCards.map((neighborhood) => (
                  <Link
                    key={neighborhood.name}
                    href={`/listings?location=${encodeURIComponent(neighborhood.name)}`}
                    className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 transition hover:border-[#28809A]/30 hover:bg-white"
                  >
                    <p className="font-medium text-[#252525]">{neighborhood.name}</p>
                    <p className="mt-1 text-sm leading-6 text-[#62686a]">
                      {neighborhood.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {filteredListings.map((listing) => (
              <ListingPreviewCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

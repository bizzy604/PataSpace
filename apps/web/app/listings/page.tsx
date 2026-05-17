/**
 * Purpose: Listings browse page — server component that fetches paginated listings from the API.
 * Why important: Primary discovery surface for incoming tenants; replaces mock data with real API.
 * Used by: /listings route in the web app.
 */
import Link from 'next/link';
import { Filter, ShieldCheck, Wallet } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { getListings } from '@/lib/api/listings';
import { formatKes } from '@/lib/format';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';
import type { ListingFilters } from '@pataspace/contracts';

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePriceFilter(price?: string): Pick<ListingFilters, 'minRent' | 'maxRent'> {
  if (price === 'KES 10k - 20k') return { minRent: 10000, maxRent: 20000 };
  if (price === 'KES 20k - 50k') return { minRent: 20000, maxRent: 50000 };
  if (price === 'KES 50k - 80k') return { minRent: 50000, maxRent: 80000 };
  if (price === 'KES 80k+') return { minRent: 80000 };
  return {};
}

function parseBedroomsFilter(bedrooms?: string): number | undefined {
  if (!bedrooms) return undefined;
  if (bedrooms === 'Bedsitter') return 0;
  const count = Number.parseInt(bedrooms, 10);
  return Number.isNaN(count) ? undefined : count;
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

  const filters: ListingFilters = {
    neighborhood: location,
    bedrooms: parseBedroomsFilter(bedrooms),
    ...parsePriceFilter(price),
  };

  const result = await getListings(filters).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0, hasNext: false, hasPrev: false } }));
  const listings = result.data;

  const averageUnlockCost = listings.length > 0
    ? Math.round(listings.reduce((sum, l) => sum + l.unlockCostCredits, 0) / listings.length)
    : 0;

  return (
    <TenantWorkspaceShell
      pathname="/listings"
      title="Listings"
      description={`Showing ${listings.length} verified homes across Nairobi. Browse freely, then unlock direct contact only when a listing is worth pursuing.`}
      actions={
        <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          <Wallet className="size-4" /> Wallet
        </Link>
      }
    >
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <MetricCard label="Results" value={`${listings.length}`} hint="Listings that match the current browse filters." Icon={Filter} />
          <MetricCard label="Typical unlock" value={formatKes(averageUnlockCost)} hint="Unlock cost follows the 10% of monthly rent marketplace rule." Icon={Wallet} />
          <MetricCard label="Verification" value="GPS-backed" hint="Listings include approved media, timestamps, and map previews before contact reveal." Icon={ShieldCheck} />
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.78fr_2.22fr]">
          <div className="space-y-5 rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">Active filters</p>
              <div className="mt-3 grid gap-2">
                {[
                  location ? `Area: ${location}` : 'Area: Any',
                  bedrooms ? `Bedrooms: ${bedrooms}` : 'Bedrooms: Any',
                  price ? `Budget: ${price}` : 'Budget: Any',
                ].map((chip) => (
                  <span key={chip} className="rounded-xl border border-black/8 bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#4b4f50]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">Explore neighborhoods</p>
              <div className="mt-3 grid gap-2.5">
                {neighborhoodSearchCards.map((neighborhood) => (
                  <Link
                    key={neighborhood.name}
                    href={`/listings?location=${encodeURIComponent(neighborhood.name)}`}
                    className="rounded-[18px] border border-black/8 bg-[#f8fafc] p-3.5 transition hover:border-[#28809A]/30 hover:bg-white"
                  >
                    <p className="font-medium text-[#252525]">{neighborhood.name}</p>
                    <p className="mt-1 text-sm leading-5 text-[#62686a]">{neighborhood.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {listings.map((listing) => (
              <ListingPreviewCard key={listing.id} listing={listing} />
            ))}
            {listings.length === 0 && (
              <p className="col-span-full py-12 text-center text-[#62686a]">No listings found for the current filters.</p>
            )}
          </div>
        </div>
      </section>
    </TenantWorkspaceShell>
  );
}

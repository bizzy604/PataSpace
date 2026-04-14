import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPinned, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { mockRecentSearches } from '@/lib/mock-app-state';
import { formatCompactKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';
import { mockListings } from '@/lib/mock-listings';

function filterListings(query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return mockListings;
  }

  return mockListings.filter((listing) =>
    [listing.title, listing.neighborhood, listing.address, listing.propertyType]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function SearchPage({ query }: { query?: string }) {
  const listings = filterListings(query);
  const hasQuery = Boolean(query?.trim());

  return (
    <TenantWorkspaceShell
      pathname="/search"
      title={hasQuery ? `Search: ${query}` : 'Search'}
      description={
        hasQuery
          ? `Showing ${listings.length} matching listings from the web catalog.`
          : 'Search neighborhoods, revisit recent queries, and jump into map or listing detail views.'
      }
      actions={
        <>
          <Link href={`/map${hasQuery ? `?q=${encodeURIComponent(query ?? '')}` : ''}`} className={linkButtonClass({ size: 'sm' })}>
            Open map view
          </Link>
          <Link href="/listings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Browse all listings
          </Link>
        </>
      }
    >
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-black/8 bg-[#f8fafc] px-4 py-3">
            <Search className="size-5 text-[#28809A]" />
            <span className="text-sm text-[#62686a]">{query?.trim() || 'Search neighborhoods, cities...'}</span>
          </div>

          {!hasQuery ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">Popular neighborhoods</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {neighborhoodSearchCards.map((card) => (
                    <Link
                      key={card.name}
                      href={`/search?q=${encodeURIComponent(card.name)}`}
                      className="overflow-hidden rounded-[18px] border border-black/8 bg-[#f8fafc] transition hover:border-[#28809A]/24 hover:bg-white"
                    >
                      <div className="relative h-32">
                        <Image
                          src={card.image}
                          alt={card.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 25vw, 100vw"
                        />
                      </div>
                      <div className="p-3.5">
                        <p className="font-medium text-[#252525]">{card.name}</p>
                        <p className="mt-1 text-sm leading-6 text-[#62686a]">{card.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">Recent searches</p>
                <div className="mt-3 space-y-2.5">
                  {mockRecentSearches.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-[18px] border border-black/8 bg-[#f8fafc] p-3.5 transition hover:border-[#28809A]/24 hover:bg-white"
                    >
                      <p className="font-medium text-[#252525]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#62686a]">{item.note}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {hasQuery ? (
        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-2">
            {listings.length ? (
              listings.map((listing) => <ListingPreviewCard key={listing.id} listing={listing} />)
            ) : (
              <div className="rounded-[24px] border border-black/8 bg-white p-8 text-center shadow-[0_16px_48px_rgba(15,23,42,0.06)] xl:col-span-2">
                <p className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">No results yet</p>
                <p className="mt-3 text-sm leading-6 text-[#62686a]">
                  Try a different neighborhood, broader keyword, or switch to the full listings view.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </TenantWorkspaceShell>
  );
}

export function MapViewPage({ query }: { query?: string }) {
  const listings = filterListings(query);
  const pinPositions = [
    { top: '20%', left: '22%' },
    { top: '48%', left: '54%' },
    { top: '66%', left: '34%' },
  ] as const;

  return (
    <TenantWorkspaceShell
      pathname="/search"
      title="Map View"
      description="Scan price points by area, then jump back into list view when you want more detail."
      actions={
        <>
          <Link href={`/search${query?.trim() ? `?q=${encodeURIComponent(query)}` : ''}`} className={linkButtonClass({ size: 'sm' })}>
            List view
          </Link>
          <Link href="/listings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Browse all
          </Link>
        </>
      }
    >
      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-black/8 bg-[radial-gradient(circle_at_top_left,rgba(40,128,154,0.16),transparent_22%),linear-gradient(180deg,#e8efe9_0%,#dbe5d8_100%)] shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 rounded-full border border-black/8 bg-white/92 px-4 py-3 shadow-soft-sm">
                <Search className="size-4 text-[#28809A]" />
                <span className="truncate text-sm text-[#62686a]">{query?.trim() || 'Search neighborhoods, cities...'}</span>
              </div>
              <Link href="/listings" className="rounded-full border border-black/8 bg-white/92 px-4 py-3 text-sm font-medium text-[#252525] shadow-soft-sm">
                List view
              </Link>
            </div>

            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(37,37,37,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(37,37,37,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />

            {listings.slice(0, 3).map((listing, index) => {
              const pin = pinPositions[index] ?? pinPositions[pinPositions.length - 1];

              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-[#28809A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#252525] shadow-soft-md"
                  style={pin}
                >
                  <MapPinned className="size-4 text-[#28809A]" />
                  {formatCompactKes(listing.monthlyRent)}
                </Link>
              );
            })}

            <div className="absolute bottom-5 left-5 right-5 rounded-[22px] border border-black/8 bg-white/94 p-5 shadow-soft-sm">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">
                Visible inventory
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                {listings.length} listings in this area
              </p>
              <p className="mt-2 text-sm leading-6 text-[#62686a]">
                Exact addresses stay hidden until unlock, but the area preview and pricing help narrow serious options first.
              </p>
            </div>
          </div>

          <Card className="border border-black/8 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Nearby listings
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-[#62686a]">
                Quick jump cards keep the map view useful before a full interactive layer lands.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="flex gap-4 rounded-[18px] border border-black/8 bg-[#f8fafc] p-4 transition hover:border-[#28809A]/24 hover:bg-white"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[16px]">
                    <Image
                      src={`/mock/houses/photo${listing.id === 'listing-1' ? '1' : listing.id === 'listing-2' ? '3' : '5'}.jpg`}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#252525]">{listing.title}</p>
                    <p className="mt-1 text-sm text-[#62686a]">{listing.neighborhood}</p>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#28809A]">
                      View details
                      <ArrowRight className="size-4" />
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </TenantWorkspaceShell>
  );
}

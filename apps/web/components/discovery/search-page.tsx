/**
 * Purpose: Search page component for the tenant workspace discovery flow.
 * Why important: Shows neighborhood cards and recent searches when idle; listing grid when queried.
 * Used by: apps/web/app/search/page.tsx
 */
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { ListingCard } from '@pataspace/contracts';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { mockRecentSearches } from '@/lib/mock-app-state';
import { linkButtonClass } from '@/lib/link-button';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';

export function SearchPage({ query, listings }: { query?: string; listings: ListingCard[] }) {
  const hasQuery = Boolean(query?.trim());

  return (
    <TenantWorkspaceShell
      pathname="/search"
      title={hasQuery ? `Search: ${query}` : 'Search'}
      description={
        hasQuery
          ? `Showing ${listings.length} matching listings from the catalog.`
          : 'Search neighborhoods, revisit recent queries, and jump into map or listing detail views.'
      }
      actions={
        <>
          <Link
            href={`/map${hasQuery ? `?q=${encodeURIComponent(query ?? '')}` : ''}`}
            className={linkButtonClass({ size: 'sm' })}
          >
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
            <span className="text-sm text-[#62686a]">
              {query?.trim() || 'Search neighborhoods, cities...'}
            </span>
          </div>

          {!hasQuery ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">
                  Popular neighborhoods
                </p>
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
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#28809A]">
                  Recent searches
                </p>
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
                <p className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  No results yet
                </p>
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

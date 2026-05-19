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
        <div className="mx-auto max-w-7xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border border-border bg-muted px-4 py-3">
            <Search className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {query?.trim() || 'Search neighborhoods, cities...'}
            </span>
          </div>

          {!hasQuery ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-primary">
                  Popular neighborhoods
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {neighborhoodSearchCards.map((card) => (
                    <Link
                      key={card.name}
                      href={`/search?q=${encodeURIComponent(card.name)}`}
                      className="overflow-hidden border border-border bg-muted transition hover:border-primary/30 hover:bg-card"
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
                        <p className="font-medium text-foreground">{card.name}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-widest text-primary">
                  Recent searches
                </p>
                <div className="mt-3 space-y-2.5">
                  {mockRecentSearches.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block border border-border bg-muted p-3.5 transition hover:border-primary/30 hover:bg-card"
                    >
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.note}</p>
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
              <div className="border border-border bg-card p-8 text-center shadow-sm xl:col-span-2">
                <p className="text-3xl font-semibold text-foreground">
                  No results yet
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
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

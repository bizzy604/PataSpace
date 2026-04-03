import Link from 'next/link';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { mockListings } from '@/lib/mock-listings';
import { mockRecentSearches } from '@/lib/mock-app-state';
import { linkButtonClass } from '@/lib/link-button';

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const q = firstValue(params.q)?.trim() ?? '';
  const normalizedQuery = q.toLowerCase();

  const results = normalizedQuery
    ? mockListings.filter((listing) =>
        [
          listing.title,
          listing.neighborhood,
          listing.address,
          listing.propertyType,
          ...listing.amenities,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : mockListings;

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Search"
        title="Search neighborhoods, listing types, and amenities"
        description="This route complements browse by letting users jump directly to a neighborhood or listing signal, then continue into the standard listing and unlock flow."
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_2.05fr]">
          <div className="space-y-6">
            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  Search directly
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-[#62686a]">
                  Try a neighborhood, furnishing style, or listing type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action="/search" className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8081]" />
                    <Input
                      name="q"
                      defaultValue={q}
                      placeholder="Search by neighborhood, property type, or amenity"
                      className="h-12 rounded-full border-black/10 pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
                      Search
                    </Button>
                    <Link href="/listings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                      <SlidersHorizontal className="size-4" />
                      Open full browse filters
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  Recent searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockRecentSearches.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 transition hover:border-[#28809A]/30 hover:bg-white"
                  >
                    <p className="font-medium text-[#252525]">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[#62686a]">{item.note}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                    Results
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                    {results.length} match{results.length === 1 ? '' : 'es'}
                  </p>
                  <p className="mt-1 text-sm text-[#62686a]">
                    {q ? `for “${q}”` : 'using all current listing data'}
                  </p>
                </div>
                <div className="rounded-full border border-black/8 bg-[#f7f4ee] px-4 py-2 text-sm text-[#4b4f50]">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="size-4 text-[#28809A]" />
                    Search routes into the same listing detail and unlock flow
                  </span>
                </div>
              </CardContent>
            </Card>

            {results.length ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {results.map((listing) => (
                  <ListingPreviewCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
                <CardHeader>
                  <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                    No results for “{q}”
                  </CardTitle>
                  <CardDescription className="text-sm leading-7 text-[#62686a]">
                    Try a broader neighborhood term like “Kilimani”, “Westlands”, or “studio”.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

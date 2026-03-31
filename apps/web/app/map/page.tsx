import Link from 'next/link';
import { Crosshair, Layers3, Minus, Plus } from 'lucide-react';
import { formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { mockListings } from '@/lib/mock-listings';

export default function MapPage() {
  const listings = mockListings.slice(0, 3);

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#EDEDED]">
      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[1.65fr_0.95fr]">
        <div
          className="relative min-h-[420px] bg-cover bg-center"
          style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.08)), url(/mock/houses/photo6.jpg)' }}
        >
          {[
            { label: '20K', top: '28%', left: '28%' },
            { label: '25K', top: '48%', left: '52%' },
            { label: '42K', top: '36%', left: '70%' },
          ].map((pin) => (
            <span
              key={pin.label}
              className="absolute inline-flex items-center justify-center rounded-full bg-[#28809A] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              style={{ top: pin.top, left: pin.left }}
            >
              {pin.label}
            </span>
          ))}

          <div className="absolute right-6 top-6 flex flex-col gap-3">
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-[#8D9192] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <Layers3 className="size-4" />
            </button>
          </div>
          <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-[#8D9192] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <Crosshair className="size-4" />
            </button>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-[#8D9192] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <Plus className="size-4" />
            </button>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-[#8D9192] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <Minus className="size-4" />
            </button>
          </div>
        </div>

        <aside className="h-[calc(100vh-80px)] overflow-y-auto bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)]">
          <div className="sticky top-0 border-b border-[#EDEDED] bg-[#EDEDED] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#252525]">
                  {listings.length} listings in this area
                </h1>
                <p className="mt-2 text-sm text-[#8D9192]">Map search built from the wireframe split layout.</p>
              </div>
              <Link href="/listings" className="rounded-full border border-[#28809A] px-4 py-2 text-sm font-semibold text-[#28809A]">
                List View
              </Link>
            </div>
          </div>

          <div className="divide-y divide-[#EDEDED]">
            {listings.map((listing) => {
              const visual = getListingVisual(listing.id);

              return (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="flex gap-4 px-6 py-5 transition-colors hover:bg-[#fafafa]">
                  <div
                    className="h-[100px] w-[100px] shrink-0 rounded-[16px] bg-cover bg-center"
                    style={{ backgroundImage: `url(${visual.hero})` }}
                  />
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[#28809A]">
                      {formatKes(listing.monthlyRent)}
                    </p>
                    <p className="mt-2 text-sm text-[#252525]">{listing.neighborhood}, {listing.county}</p>
                    <p className="mt-2 text-sm text-[#8D9192]">
                      {listing.bedrooms} bed / {listing.bathrooms} bath / {listing.propertyType}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

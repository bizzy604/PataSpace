import Link from 'next/link';
import { Grid2X2, LayoutList, Map, SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '@/components/listings/listing-card';
import { formatKes } from '@/lib/format';
import { mockCreditBalance, mockCurrentUser } from '@/lib/mock-app-state';
import { mockListings } from '@/lib/mock-listings';

const filterSections = {
  neighborhoods: ['Kilimani', 'Westlands', 'Lavington', 'Parklands'],
  propertyTypes: ['Apartment', 'Bedsitter', 'Studio'],
  beds: ['Any', '1+', '2+', '3+'],
  baths: ['Any', '1+', '2+'],
};

export default function ListingsPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] gap-0">
        <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-[280px] shrink-0 overflow-y-auto bg-[#252525] px-6 py-6 text-white shadow-[4px_0_24px_rgba(0,0,0,0.3)] xl:block">
          <p className="font-display text-2xl font-bold tracking-[-0.04em]">PataSpace</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#28809A] text-sm font-semibold text-white">
              {mockCurrentUser.firstName[0]}
              {mockCurrentUser.lastName[0]}
            </div>
            <div>
              <p className="text-sm text-white/80">Hello, {mockCurrentUser.firstName}</p>
              <p className="font-display text-xl font-semibold text-[#67d1e3]">{formatKes(mockCreditBalance.balance)}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[20px] bg-[#28809A] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Your Balance</p>
            <p className="mt-3 font-display text-3xl font-bold">{formatKes(mockCreditBalance.balance)}</p>
            <p className="mt-2 text-xs text-white/70">About 2 unlocks ready</p>
            <Link
              href="/wallet/buy"
              className="mt-4 inline-flex size-10 items-center justify-center rounded-full bg-white text-[#28809A]"
            >
              +
            </Link>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Filters</p>
              <div className="mt-3 rounded-[14px] border border-white/15 bg-white/8 px-4 py-3 text-sm text-white">
                Nairobi County
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Neighborhoods</p>
              <div className="mt-3 space-y-3">
                {filterSections.neighborhoods.map((item, index) => (
                  <label key={item} className="flex items-center gap-3 text-sm text-white">
                    <span
                      className={`inline-flex size-5 rounded-[6px] border ${index === 0 ? 'border-[#28809A] bg-[#28809A]' : 'border-white/40 bg-transparent'}`}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Rent Range</p>
              <div className="mt-3 rounded-full bg-white/20">
                <div className="h-2 w-2/3 rounded-full bg-[#28809A]" />
              </div>
              <p className="mt-3 text-xs text-white/70">10K - 50K</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Bedrooms</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {filterSections.beds.map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-full px-4 py-2 text-sm ${index === 0 ? 'bg-[#28809A] text-white' : 'bg-white/10 text-white'}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Bathrooms</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {filterSections.baths.map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-full px-4 py-2 text-sm ${index === 0 ? 'bg-[#28809A] text-white' : 'bg-white/10 text-white'}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Property Type</p>
              <div className="mt-3 space-y-3">
                {filterSections.propertyTypes.map((item, index) => (
                  <label key={item} className="flex items-center gap-3 text-sm text-white">
                    <span
                      className={`inline-flex size-5 rounded-[6px] border ${index === 0 ? 'border-[#28809A] bg-[#28809A]' : 'border-white/40 bg-transparent'}`}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button type="button" className="flex-1 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white">
              Clear
            </button>
            <button type="button" className="flex-1 rounded-full bg-[#28809A] px-4 py-3 text-sm font-semibold text-white">
              Apply
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EDEDED] pb-6">
            <div>
              <p className="text-sm text-[#8D9192]">Home / Browse Listings</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-[#252525]">
                {mockListings.length} listings found
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/saved"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#EDEDED] px-4 text-sm font-semibold text-[#252525]"
              >
                Saved
              </Link>
              <div className="inline-flex rounded-full border border-[#EDEDED] bg-white p-1">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#28809A] text-white">
                  <Grid2X2 className="size-4" />
                </span>
                <span className="inline-flex size-9 items-center justify-center rounded-full text-[#8D9192]">
                  <LayoutList className="size-4" />
                </span>
              </div>
              <button type="button" className="inline-flex h-11 items-center justify-center rounded-full border border-[#EDEDED] px-4 text-sm font-medium text-[#252525]">
                Newest First
              </button>
              <Link
                href="/map"
                className="inline-flex size-11 items-center justify-center rounded-full bg-[#28809A] text-white"
              >
                <Map className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 xl:hidden">
            <button type="button" className="inline-flex h-11 items-center justify-center rounded-full border border-[#EDEDED] px-4 text-sm font-semibold text-[#252525]">
              <SlidersHorizontal className="mr-2 size-4 text-[#28809A]" />
              Filters
            </button>
            <span className="rounded-full bg-[#EDEDED] px-4 py-3 text-sm font-medium text-[#252525]">Kilimani</span>
            <span className="rounded-full bg-[#EDEDED] px-4 py-3 text-sm font-medium text-[#252525]">Apartment</span>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {mockListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {['<', '1', '2', '3', '>'].map((item, index) => (
              <button
                key={item}
                type="button"
                className={`inline-flex size-11 items-center justify-center rounded-full text-sm font-semibold ${
                  index === 1 ? 'bg-[#28809A] text-white' : 'border border-[#EDEDED] bg-white text-[#8D9192]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

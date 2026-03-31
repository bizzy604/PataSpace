import Link from 'next/link';
import { Clock3, Search, TrendingUp } from 'lucide-react';
import { ListingCard } from '@/components/listings/listing-card';
import { neighborhoodSearchCards } from '@/lib/listing-visuals';
import { mockListings } from '@/lib/mock-listings';

export default function SearchPage() {
  const results = mockListings.slice(0, 2);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="rounded-[24px] bg-[#EDEDED] px-6 py-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <div className="mx-auto max-w-[600px] rounded-full border-2 border-[#EDEDED] bg-white px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <Search className="size-5 text-[#28809A]" />
              <span className="text-lg text-[#252525]">Kilimani 2 bedroom</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Popular searches</p>
              <div className="mt-4 rounded-[24px] border border-[#EDEDED] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                {['Kilimani 2 bedroom', 'Westlands under 30K', 'Lavington apartment'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[16px] px-3 py-3 text-sm text-[#252525] hover:bg-[#fafafa]">
                    <TrendingUp className="size-4 text-[#28809A]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Recent</p>
              <div className="mt-4 rounded-[24px] border border-[#EDEDED] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                {['Ngong Road studio', 'South B budget', 'Westlands loft'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[16px] px-3 py-3 text-sm text-[#252525] hover:bg-[#fafafa]">
                    <Clock3 className="size-4 text-[#8D9192]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D9192]">Browse by neighborhood</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {neighborhoodSearchCards.map((card) => (
                  <Link
                    key={card.name}
                    href={`/listings?area=${encodeURIComponent(card.name)}`}
                    className="group overflow-hidden rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                  >
                    <div
                      className="aspect-[4/3] bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(37,37,37,0.04), rgba(37,37,37,0.6)), url(${card.image})` }}
                    />
                    <div className="-mt-16 p-5 text-white">
                      <p className="font-display text-2xl font-semibold tracking-[-0.04em]">{card.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-[24px] border border-[#EDEDED] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <p className="text-sm text-[#8D9192]">Results for:</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-[#252525]">
                Kilimani 2 bedroom
              </h1>
              <div className="mt-4 flex flex-wrap gap-3">
                {['Westlands 2BR', 'Lavington', 'Under 25K'].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#EDEDED] bg-[#fafafa] px-4 py-2 text-sm text-[#252525]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Heart } from 'lucide-react';
import { ListingCard } from '@/components/listings/listing-card';
import { mockListings } from '@/lib/mock-listings';

export default function SavedPage() {
  const savedListings = mockListings.slice(0, 2);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="rounded-[24px] bg-[#EDEDED] px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <h1 className="font-display text-4xl font-bold tracking-[-0.05em] text-[#252525]">Saved Properties</h1>
          <p className="mt-4 text-lg text-[#8D9192]">You have {savedListings.length} saved listings.</p>
        </div>

        {savedListings.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center rounded-[24px] border border-[#EDEDED] bg-white px-6 py-20 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex size-24 items-center justify-center rounded-full bg-[#EDEDED] text-[#8D9192]">
              <Heart className="size-10" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold tracking-[-0.04em] text-[#252525]">
              No Saved Properties Yet
            </h2>
            <p className="mt-4 max-w-[520px] text-base leading-7 text-[#8D9192]">
              Browse listings and tap the heart icon to keep serious options in one place.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

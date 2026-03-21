import { ListingCard } from '../../components/listings/listing-card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { mockListings } from '../../lib/mock-listings';

export default function ListingsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-amber-700">
            Explore
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">
            Current listings
          </h1>
        </div>
        <p className="max-w-md text-right text-sm leading-6 text-stone-600">
          Filter by neighborhood, rent, availability, and bedrooms once the API layer is wired.
        </p>
      </div>

      <div className="mb-8 grid gap-3 rounded-3xl border border-stone-300/80 bg-white/80 p-4 shadow-sm backdrop-blur md:grid-cols-[1fr_220px_220px_auto]">
        <Input placeholder="Search neighborhood" />
        <Input placeholder="Min rent" />
        <Input placeholder="Max rent" />
        <Button>Apply filters</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          Nairobi
        </span>
        <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          1+ bedroom
        </span>
        <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          Mobile-verified
        </span>
      </div>

      {mockListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </section>
  );
}

import { ListingCard } from '../../components/listings/listing-card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { mockListings } from '../../lib/mock-listings';

export default function ListingsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Explore</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
            Current listings
          </h1>
        </div>
        <p className="max-w-md text-right text-sm leading-6 text-foreground-secondary">
          Filter by neighborhood, rent, availability, and bedrooms once the API layer is wired.
        </p>
      </div>

      <div className="mb-8 grid gap-3 rounded-[32px] border border-separator-strong bg-surface-elevated p-4 shadow-soft-md backdrop-blur-2xl md:grid-cols-[1fr_220px_220px_auto]">
        <Input placeholder="Search neighborhood" />
        <Input placeholder="Min rent" />
        <Input placeholder="Max rent" />
        <Button>Apply filters</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-separator bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-secondary shadow-soft-sm">
          Nairobi
        </span>
        <span className="rounded-full border border-separator bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-secondary shadow-soft-sm">
          1+ bedroom
        </span>
        <span className="rounded-full border border-separator bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-secondary shadow-soft-sm">
          Mobile-verified
        </span>
      </div>

      {mockListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </section>
  );
}

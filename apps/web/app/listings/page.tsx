import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '@/components/listings/listing-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/shared/page-intro';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { mockListings } from '@/lib/mock-listings';

export default function ListingsPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        badge="Browse listings"
        kicker="Web discovery"
        title="Search the verified handover inventory."
        description="Search and filters are embedded directly into the web browse page instead of being split into separate mobile sheets."
        actions={
          <Link href="/support" className={linkButtonVariants({ variant: 'outline' })}>
            Need help first?
          </Link>
        }
      />

      <Card className="mt-8 bg-surface-elevated shadow-soft-md">
        <CardContent className="grid gap-3 py-5 md:grid-cols-[1.3fr_0.9fr_0.9fr_auto]">
          <Input placeholder="Search neighborhood e.g. Kilimani" />
          <Input placeholder={`Min rent e.g. ${formatKes(15000)}`} />
          <Input placeholder={`Max rent e.g. ${formatKes(45000)}`} />
          <Link href="/listings" className={linkButtonVariants()}>
            <SlidersHorizontal className="size-4" />
            Apply filters
          </Link>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-wrap gap-2">
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

      <p className="mt-5 text-sm text-foreground-secondary">
        {mockListings.length} listings in the current web inventory. Listing detail and unlock routes are already scaffolded from this page.
      </p>

      {mockListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </section>
  );
}

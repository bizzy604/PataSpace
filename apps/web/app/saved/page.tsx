import Link from 'next/link';
import { Bookmark, Search, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { MetricCard } from '@/components/shared/metric-card';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { mockSavedListingIds } from '@/lib/mock-app-state';
import { mockListings } from '@/lib/mock-listings';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const savedListings = mockListings.filter((listing) => mockSavedListingIds.includes(listing.id));
  const averageUnlock = Math.round(
    savedListings.reduce((sum, listing) => sum + listing.unlockCostCredits, 0) /
      Math.max(savedListings.length, 1),
  );

  return (
    <TenantWorkspaceShell
      pathname="/saved"
      title="Saved listings"
      description="A shortlist of homes worth returning to before you decide whether to fund the wallet or unlock direct contact."
      actions={
        <>
          <Link href="/search" className={linkButtonClass({ size: 'sm' })}>
            Search more
          </Link>
          <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Wallet
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Saved homes"
          value={`${savedListings.length}`}
          hint="Listings pinned for later review."
          Icon={Bookmark}
        />
        <MetricCard
          label="Average unlock"
          value={formatKes(averageUnlock)}
          hint="Typical contact reveal cost across the saved shortlist."
          Icon={Wallet2}
        />
        <MetricCard
          label="Next step"
          value="Compare"
          hint="Review details again, then move into unlock only for serious leads."
          Icon={Search}
        />
      </div>

      {savedListings.length ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {savedListings.map((listing) => (
            <ListingPreviewCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <Card className="mt-6 border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              No saved listings yet
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Use browse or search to build a shortlist before spending credits.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </TenantWorkspaceShell>
  );
}

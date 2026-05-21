/**
 * Purpose: Server route for the tenant saved-listings workspace.
 * Why important: Reads the authenticated user's saved listings from
 *   /me/saved-listings and renders ListingPreviewCards for the contract
 *   ListingCard payloads. Previously rendered mock data.
 * Used by: Next.js routing for /saved.
 */
import Link from 'next/link';
import { Bookmark, Search, Wallet2 } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { SavedListingRecord } from '@pataspace/contracts';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { MetricCard } from '@/components/shared/metric-card';
import { ListingPreviewCard } from '@/components/listings/listing-preview-card';
import { getMySavedListings } from '@/lib/api/saved-listings';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const saved: SavedListingRecord[] = await getMySavedListings(token, 1, 50)
    .then((response) => response.data)
    .catch(() => []);

  const averageUnlock = Math.round(
    saved.reduce((sum, entry) => sum + entry.listing.unlockCostCredits, 0) /
      Math.max(saved.length, 1),
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
          value={`${saved.length}`}
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

      {saved.length ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {saved.map((entry) => (
            <ListingPreviewCard key={entry.id} listing={entry.listing} />
          ))}
        </div>
      ) : (
        <Card className="mt-6 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">
              No saved listings yet
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Use browse or search to build a shortlist before spending credits.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </TenantWorkspaceShell>
  );
}

/**
 * Purpose: Server page that renders the unlock-checkout surface for a listing.
 * Why important: Pulls the live listing record, wallet balance, and existing
 *   unlock from the backend so the client checkout button can either reveal
 *   contact (POST /unlocks) or jump to top-up when credits are short.
 * Used by: Next.js routing for /listings/[id]/unlock.
 */
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ShieldCheck, Wallet } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { MyUnlockRecord } from '@pataspace/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { UnlockCheckoutButton } from '@/components/unlocks/unlock-checkout-button';
import { getListingById } from '@/lib/api/listings';
import { getMyUnlocks } from '@/lib/api/unlocks';
import { getCreditBalance } from '@/lib/api/credits';
import { formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { getToken } = await auth();
  const token = await getToken();

  const listing = await getListingById(id, token).catch(() => null);
  if (!listing) {
    notFound();
  }

  const [balance, unlocks] = await Promise.all([
    getCreditBalance(token).catch(() => null),
    getMyUnlocks(token, 1, 100).catch(
      () => ({ data: [] as MyUnlockRecord[] }) as { data: MyUnlockRecord[] },
    ),
  ]);

  const existingUnlock = unlocks.data.find(
    (entry) => entry.listing.id === listing.id,
  );
  const currentBalance = balance?.balance ?? 0;
  const postUnlockBalance = currentBalance - listing.unlockCostCredits;
  const insufficient = !existingUnlock && currentBalance < listing.unlockCostCredits;
  const visual = getListingVisual(listing.id);
  const listingTitle =
    listing.bedrooms === 0
      ? `Studio · ${listing.neighborhood}`
      : `${listing.bedrooms}BR · ${listing.neighborhood}`;

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Unlock confirmation"
        title="Review the spend before revealing contact"
        description="This is the paid step in the tenant flow. Spend once to reveal the contact details, notify the current tenant, and move the listing into confirmation or dispute follow-through."
        actions={
          <>
            <Link
              href={`/listings/${listing.id}`}
              className={linkButtonClass({ variant: 'outline', size: 'sm' })}
            >
              Back to listing
            </Link>
            <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>
              Top up wallet
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border border-border bg-card shadow-sm">
            <div className="relative h-72">
              <Image
                src={visual.hero}
                alt={visual.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
            <CardContent className="space-y-5 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Listing summary
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-foreground">
                  {listingTitle}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {listing.description}
                </p>
              </div>

              <div className="grid gap-3 border border-border bg-muted p-4 text-sm text-muted-foreground sm:grid-cols-3">
                <p>{listing.neighborhood}</p>
                <p>{formatKes(listing.monthlyRent)} monthly rent</p>
                <p>{listing.unlockCount} previous unlocks</p>
              </div>

              <div className="grid gap-3">
                {[
                  'Exact address, directions, map pin, and contact numbers are revealed immediately after purchase.',
                  'Repeat unlocks stay idempotent and will not charge twice for the same listing.',
                  'The current tenant is notified so both sides can move into confirmation workflow cleanly.',
                ].map((item) => (
                  <div
                    key={item}
                    className="border border-border bg-muted p-4 text-sm leading-7 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">
                Wallet checkout
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Unlock pricing follows the marketplace rule of 10% of monthly rent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="border border-border bg-primary p-5 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  Unlock cost
                </p>
                <p className="mt-2 text-4xl font-semibold">
                  {formatKes(listing.unlockCostCredits)}
                </p>
                <div className="mt-5 grid gap-3 text-sm text-primary-foreground/80">
                  <p className="flex items-center justify-between">
                    <span>Current balance</span>
                    <span>{formatKes(currentBalance)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Balance after unlock</span>
                    <span>{formatKes(Math.max(postUnlockBalance, 0))}</span>
                  </p>
                </div>
              </div>

              <div className="border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Protected actions after purchase
                </p>
                <p className="mt-2">
                  Unlock detail, move-in confirmation, and dispute follow-through all reuse the same paid record.
                </p>
              </div>

              <UnlockCheckoutButton
                listingId={listing.id}
                existingUnlockId={existingUnlock?.unlockId ?? null}
                insufficientCredits={insufficient}
              />

              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                <Wallet className="size-4" />
                Review wallet history first
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

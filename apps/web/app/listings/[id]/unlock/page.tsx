import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ShieldCheck, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { getMockListingById } from '@/lib/mock-listings';
import { formatKes } from '@/lib/format';
import { getListingVisual } from '@/lib/listing-visuals';
import { getMockUnlockByListingId, mockCreditBalance } from '@/lib/mock-app-state';
import { linkButtonClass } from '@/lib/link-button';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const visual = getListingVisual(listing.id);
  const postUnlockBalance = mockCreditBalance.balance - listing.unlockCostCredits;
  const existingUnlock = getMockUnlockByListingId(listing.id);

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
          <Card className="overflow-hidden border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
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
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                  Listing summary
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  {listing.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#62686a]">{listing.description}</p>
              </div>

              <div className="grid gap-3 rounded-[24px] bg-[#f7f4ee] p-4 text-sm text-[#4b4f50] sm:grid-cols-3">
                <p>{listing.neighborhood}</p>
                <p>{formatKes(listing.monthlyRent)} monthly rent</p>
                <p>{listing.unlockCount} previous unlocks</p>
              </div>

              <div className="grid gap-3">
                {[
                  'Exact address, directions, map pin, and contact numbers are revealed immediately after purchase.',
                  'Repeat unlocks stay idempotent and should not charge twice for the same listing.',
                  'The current tenant is notified so both sides can move into confirmation workflow cleanly.',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-black/8 bg-[#fbfaf7] p-4 text-sm leading-7 text-[#4b4f50]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Wallet checkout
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Unlock pricing follows the marketplace rule of 10% of monthly rent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[24px] border border-black/8 bg-[#252525] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
                  Unlock cost
                </p>
                <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.07em]">
                  {formatKes(listing.unlockCostCredits)}
                </p>
                <div className="mt-5 grid gap-3 text-sm text-white/72">
                  <p className="flex items-center justify-between">
                    <span>Current balance</span>
                    <span>{formatKes(mockCreditBalance.balance)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Balance after unlock</span>
                    <span>{formatKes(postUnlockBalance)}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#28809A]/12 bg-[#28809A]/6 p-4 text-sm leading-7 text-[#4b4f50]">
                <p className="inline-flex items-center gap-2 font-medium text-[#252525]">
                  <ShieldCheck className="size-4 text-[#28809A]" />
                  Protected actions after purchase
                </p>
                <p className="mt-2">
                  Unlock detail, move-in confirmation, and dispute follow-through all reuse the same paid record.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={existingUnlock ? `/unlocks/${existingUnlock.unlockId}` : '/unlocks'}
                  className={linkButtonClass({ size: 'sm' })}
                >
                  Reveal contact
                </Link>
                <Link
                  href="/wallet/processing"
                  className={linkButtonClass({ variant: 'outline', size: 'sm' })}
                >
                  Preview processing state
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <Link href="/wallet" className="inline-flex items-center gap-2 text-sm font-medium text-[#28809A]">
                <Wallet className="size-4" />
                Review wallet history first
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

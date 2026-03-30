import Link from 'next/link';
import { ArrowRight, BadgeCheck, CreditCard, ShieldCheck, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyStat } from '@/components/shared/key-stat';
import { MediaTile } from '@/components/shared/media-tile';
import { PageIntro } from '@/components/shared/page-intro';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { mockCreditBalance, mockUnlocks } from '@/lib/mock-app-state';
import { mockListings } from '@/lib/mock-listings';

export default function HomePage() {
  const featuredListings = mockListings.slice(0, 2);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-8">
          <PageIntro
            badge="Tenant-facing web rollout"
            kicker="Docs-aligned web scope"
            title="Move into verified homes without wasting weekends on fake listings."
            description="The web app now focuses on the incoming-tenant flow: browse, unlock, buy credits, confirm a connection, and get support when something goes wrong."
            actions={
              <>
                <Link href="/listings" className={linkButtonVariants()}>
                  Browse listings
                </Link>
                <Link href="/auth/register" className={linkButtonVariants({ variant: 'outline' })}>
                  Create account
                </Link>
              </>
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <KeyStat label="Web screens" value="20 core routes" />
            <KeyStat label="Wallet balance" value={formatKes(mockCreditBalance.balance)} />
            <KeyStat label="Live unlocks" value={`${mockUnlocks.length} tracked`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-surface-elevated">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                  <BadgeCheck className="size-5" />
                </div>
                <CardTitle>Media plus GPS proof</CardTitle>
                <CardDescription>
                  Listing evidence comes from the finished mobile capture flow, not from recycled broker uploads.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-surface-elevated">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                  <CreditCard className="size-5" />
                </div>
                <CardTitle>Credits only when you need them</CardTitle>
                <CardDescription>
                  Browse everything for free, then pay to reveal only the listing you are ready to pursue.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-surface-elevated">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle>Confirmation and dispute path</CardTitle>
                <CardDescription>
                  The web journey continues after unlock, including proof of contact, move-in confirmation, and issue reporting.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <p className="section-kicker text-white/60">Build focus</p>
            <CardTitle className="text-white">Phase 1 web screens</CardTitle>
            <CardDescription className="text-white/72">
              Discovery, auth, wallet, unlock, and support are now mapped into a coherent route set.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            {[
              'Landing, listings, details, and photo gallery',
              'Register, OTP verify, and sign in',
              'Wallet, buy credits, processing, and transaction history',
              'Unlock confirmation, contact reveal, confirmation, and dispute',
              'Profile and support',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/80"
              >
                <span>{item}</span>
                <Unlock className="size-4 text-[#67d1e3]" />
              </div>
            ))}
            <Link
              href="/profile"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#67d1e3]"
            >
              Open the tenant dashboard
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <PageIntro
          badge="Featured listings"
          kicker="Discovery flow"
          title="Start with listings that already carry the handover evidence."
          description="These are rendered as web cards now, but they stay aligned with the mobile-first listing source and unlock economics."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {featuredListings.map((listing) => (
            <div
              key={listing.id}
              className="space-y-4 rounded-[32px] border border-separator bg-card p-5 shadow-soft-md"
            >
              <MediaTile
                title={listing.media[0].title}
                caption={listing.media[0].caption}
                tone={listing.media[0].tone}
                gpsTag={listing.media[0].gpsTag}
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {listing.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                    {listing.neighborhood} • {formatKes(listing.monthlyRent)} / month
                  </p>
                </div>
                <Link href={`/listings/${listing.id}`} className={linkButtonVariants({ size: 'sm' })}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

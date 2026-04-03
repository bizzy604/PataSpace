import Link from 'next/link';
import { MapPinned, ShieldCheck, Wallet, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { MetricCard } from '@/components/shared/metric-card';
import { mockListings } from '@/lib/mock-listings';
import { mockUnlocks } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

const principles = [
  {
    title: 'Browse stays free',
    body: 'Incoming tenants can evaluate listings, media evidence, amenities, neighborhood, and approximate location before spending anything.',
  },
  {
    title: 'Direct contact is the paid step',
    body: 'PataSpace charges only when a user is ready to reveal the exact address and phone number for a listing.',
  },
  {
    title: 'Trust is part of the product',
    body: 'Mobile-first listing capture, GPS-backed media, verification notes, and disputes are all part of the same marketplace loop.',
  },
] as const;

export default function Page() {
  const averageRent = Math.round(
    mockListings.reduce((sum, listing) => sum + listing.monthlyRent, 0) / Math.max(mockListings.length, 1),
  );

  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="About PataSpace"
        title="A tenant-to-tenant housing marketplace built for Nairobi"
        description="PataSpace is structured around one belief: the best person to explain a home is often the tenant leaving it. The web experience focuses on incoming-tenant discovery, credit funding, unlocks, and follow-through after contact is revealed."
        actions={
          <>
            <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
              Browse listings
            </Link>
            <Link href="/how-it-works" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              See how it works
            </Link>
          </>
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          <MetricCard
            label="Verified listings"
            value={`${mockListings.length}`}
            hint="Current mock inventory wired through the web experience."
            Icon={ShieldCheck}
          />
          <MetricCard
            label="Unlock records"
            value={`${mockUnlocks.length}`}
            hint="Paid contact reveals already modeled through follow-through workflows."
            Icon={Wallet}
          />
          <MetricCard
            label="Typical rent"
            value={formatKes(averageRent)}
            hint="Representative monthly rent across the current Nairobi sample."
            Icon={MapPinned}
          />
          <MetricCard
            label="Audience"
            value="Incoming tenants"
            hint="This web app is focused on the renter side of the marketplace."
            Icon={Users}
          />
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Why this exists
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Traditional rental discovery often charges for access but still leaves the renter with weak information. PataSpace flips that by making context visible first and charging only when a listing becomes worth pursuing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {principles.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-5"
                >
                  <p className="font-display text-xl font-semibold tracking-[-0.04em] text-[#252525]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#62686a]">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
                Marketplace guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-white/76">
              <p>Listing creation stays mobile-first so media capture and GPS evidence are stronger.</p>
              <p>Unlock pricing stays tied to rent, which keeps contact reveal aligned with listing value.</p>
              <p>Disputes, refunds, and confirmation remain explicit parts of the workflow, not side conversations.</p>
              <p>Outgoing-tenant commissions only move forward after both sides confirm the connection outcome.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

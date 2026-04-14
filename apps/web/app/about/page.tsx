import Link from 'next/link';
import { MapPinned, ShieldCheck, Wallet, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard } from '@/components/shared/metric-card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { mockListings } from '@/lib/mock-listings';
import { mockUnlocks } from '@/lib/mock-app-state';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

const principles = [
  {
    title: 'Browse first',
    body: 'Renters can compare homes, media, and neighborhood context before paying.',
  },
  {
    title: 'Pay only to reveal contact',
    body: 'Credits are used only when a renter decides to reveal the exact address and phone number.',
  },
  {
    title: 'Verification is built in',
    body: 'Listing capture, GPS-backed media, notes, and disputes stay inside one system.',
  },
] as const;

export default function Page() {
  const averageRent = Math.round(
    mockListings.reduce((sum, listing) => sum + listing.monthlyRent, 0) / Math.max(mockListings.length, 1),
  );

  return (
    <TenantWorkspaceShell
      pathname="/about"
      title="About PataSpace"
      description="Tenant-first rental discovery for Nairobi, built around verified browsing, credits, and direct contact reveal."
      actions={
        <>
          <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
            Browse listings
          </Link>
          <Link href="/how-it-works" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            How it works
          </Link>
        </>
      }
    >
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
                Traditional rental search often asks for commitment too early. PataSpace keeps discovery open and charges only at the decision point.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {principles.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-black/8 bg-[#f8fafc] p-5"
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
              <p>Listing capture stays mobile-first so media and location proof are stronger.</p>
              <p>Unlock pricing stays tied to rent to keep reveal value predictable.</p>
              <p>Disputes, refunds, and confirmation are handled inside the product.</p>
              <p>Commissions move only after both sides confirm the outcome.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </TenantWorkspaceShell>
  );
}

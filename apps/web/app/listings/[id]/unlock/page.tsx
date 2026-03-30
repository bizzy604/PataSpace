import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPinned, Phone, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { mockUnlocks } from '@/lib/mock-app-state';
import { getMockListingById } from '@/lib/mock-listings';

type ListingUnlockPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingUnlockPage({ params }: ListingUnlockPageProps) {
  const { id } = await params;
  const listing = getMockListingById(id);

  if (!listing) {
    notFound();
  }

  const existingUnlock = mockUnlocks.find((unlock) => unlock.listingId === listing.id);
  const revealItems = [
    { label: 'Phone number', value: listing.contactInfo.phoneNumber, Icon: Phone },
    { label: 'Address', value: listing.contactInfo.address, Icon: MapPinned },
    {
      label: 'Support path',
      value: 'Dispute flow remains available if evidence and outcome diverge',
      Icon: ShieldCheck,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Unlock confirmation"
        kicker={listing.neighborhood}
        title={`Unlock ${listing.title}`}
        description="Unlock cost stays aligned with the project rule: 10 percent of monthly rent. The web route mirrors the documented sheet flow, adapted into a desktop-ready confirmation page."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>What you get immediately</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5 text-sm text-foreground-secondary">
            {revealItems.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-[24px] border border-separator bg-fill-soft px-4 py-4"
              >
                <div className="mt-1 flex size-9 items-center justify-center rounded-full bg-card text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="mt-2 leading-6">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Cost breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              <span>Monthly rent</span>
              <span className="font-semibold text-white">{formatKes(listing.monthlyRent)}</span>
            </div>
            <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
              <span>Unlock charge</span>
              <span className="font-semibold text-white">{formatKes(listing.unlockCostCredits)}</span>
            </div>
            <div className="rounded-[22px] border border-[#67d1e3]/20 bg-[#67d1e3]/10 px-4 py-3 text-white">
              Formula check: unlock cost equals 10 percent of rent.
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={existingUnlock ? `/unlocks/${existingUnlock.unlockId}` : '/auth/sign-in'}
                className={linkButtonVariants()}
              >
                Confirm unlock
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/wallet" className={linkButtonVariants({ variant: 'outline' })}>
                Top up wallet
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

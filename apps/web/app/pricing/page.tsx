import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { creditPackages } from '@/lib/mock-app-state';
import { mockListings } from '@/lib/mock-listings';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  return (
    <TenantWorkspaceShell
      pathname="/pricing"
      title="Pricing"
      description="Credits are bought in packages, while each unlock follows the listing-based marketplace formula."
      actions={
        <>
          <Link href="/wallet/buy" className={linkButtonClass({ size: 'sm' })}>
            Buy credits
          </Link>
          <Link href="/listings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Compare listings
          </Link>
        </>
      }
    >
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">
                Listing unlock formula
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Unlock cost = 10% of monthly rent. Owner commission = 30% of the unlock cost after confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockListings.map((listing) => {
                const commission = Math.round(listing.unlockCostCredits * 0.3);

                return (
                  <div
                    key={listing.id}
                    className="border border-border bg-muted p-5"
                  >
                    <p className="text-xl font-semibold text-foreground">
                      {listing.title}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm leading-7 text-muted-foreground">
                      <p className="flex items-center justify-between">
                        <span>Monthly rent</span>
                        <span>{formatKes(listing.monthlyRent)}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Unlock cost</span>
                        <span>{formatKes(listing.unlockCostCredits)}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Potential owner commission</span>
                        <span>{formatKes(commission)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border border-border bg-foreground text-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-background">
                Wallet packages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditPackages.map((pkg) => {
                const isRecommended = 'recommended' in pkg && pkg.recommended;

                return (
                  <div
                    key={pkg.id}
                    className={`border p-5 ${isRecommended ? 'border-background/20 bg-background/12' : 'border-background/10 bg-background/6'}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-background/60">
                      {pkg.name}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-background">
                      {formatKes(pkg.amount)}
                    </p>
                    <p className="mt-1 text-sm text-background/70">{pkg.credits} credits</p>
                    <p className="mt-3 text-sm leading-7 text-background/76">{pkg.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center border border-border bg-primary/10 text-primary">
                  <Calculator className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-3xl font-semibold text-foreground">
                    Pricing intent
                  </CardTitle>
                  <CardDescription className="text-sm leading-7 text-muted-foreground">
                    Wallet packages cover browsing runway. Unlock pricing reflects the listing you decide to pursue.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                'Browse stays free so renters can compare before paying.',
                'Unlocks should not bill twice for the same listing.',
                'Refunds stay explicit when a dispute proves the reveal was invalid.',
              ].map((item) => (
                <div
                  key={item}
                  className="border border-border bg-muted p-5 text-sm leading-7 text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </TenantWorkspaceShell>
  );
}

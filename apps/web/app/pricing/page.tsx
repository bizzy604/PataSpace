/**
 * Purpose: Public "Pricing" marketing page — explains the credit and unlock
 *   model with worked examples.
 * Why important: Sets pricing expectations before tenants install the mobile
 *   app, where purchases actually happen.
 * Used by: /pricing route.
 */
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

const rentExamples = [
  { label: 'Bedsitter, Umoja', monthlyRent: 8000 },
  { label: 'One bedroom, Kilimani', monthlyRent: 25000 },
  { label: 'Two bedroom, Kileleshwa', monthlyRent: 45000 },
] as const;

export default function Page() {
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Pricing"
        title="Browse free, pay only to unlock"
        description="Credits are bought in packages inside the mobile app. Each unlock follows the same listing-based formula, so the reveal price is always predictable."
        actions={
          <>
            <Link href="/#join" className={linkButtonClass({ size: 'sm' })}>
              Join the waitlist
            </Link>
            <Link href="/how-it-works" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              How it works
            </Link>
          </>
        }
      />

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">
                Listing unlock formula
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Unlock cost = 10% of monthly rent. Outgoing-tenant commission = 30% of the unlock cost after both sides confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {rentExamples.map((example) => {
                const unlockCost = Math.round(example.monthlyRent * 0.1);
                const commission = Math.round(unlockCost * 0.3);

                return (
                  <div key={example.label} className="border border-border bg-muted p-5">
                    <p className="text-xl font-semibold text-foreground">{example.label}</p>
                    <div className="mt-3 grid gap-2 text-sm leading-7 text-muted-foreground">
                      <p className="flex items-center justify-between">
                        <span>Monthly rent</span>
                        <span>{formatKes(example.monthlyRent)}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Unlock cost</span>
                        <span>{formatKes(unlockCost)}</span>
                      </p>
                      <p className="flex items-center justify-between">
                        <span>Outgoing-tenant commission</span>
                        <span>{formatKes(commission)}</span>
                      </p>
                    </div>
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
                    Credit packages cover browsing runway. Unlock pricing reflects the listing you decide to pursue.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                'Browse stays free so renters can compare before paying.',
                'Unlocks never bill twice for the same listing.',
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
    </PublicSiteFrame>
  );
}

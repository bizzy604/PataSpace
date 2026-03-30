import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageIntro } from '@/components/shared/page-intro';
import { formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { creditPackages } from '@/lib/mock-app-state';

export default function BuyCreditsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Buy credits"
        kicker="M-Pesa purchase flow"
        title="Select a package and trigger the STK push."
        description="The backend exposes credit purchase creation under `/api/v1/credits/purchase`. This screen is the web surface for that flow."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {creditPackages.map((pkg) => (
              <label
                key={pkg.id}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-[24px] border border-separator bg-card px-4 py-4 transition hover:border-separator-strong"
              >
                <div>
                  <p className="font-semibold text-foreground">{pkg.name}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground-secondary">{pkg.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {formatKes(pkg.amount)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-secondary">
                    {pkg.credits} credits
                  </p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">M-Pesa details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            <Input placeholder="+254712345678" />
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/76">
              Enter the Safaricom number that should receive the STK push. The backend will create a pending purchase before waiting for the callback.
            </div>
            <Link href="/wallet/processing" className={linkButtonVariants({ fullWidth: true })}>
              <Smartphone className="size-4" />
              Trigger STK push
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

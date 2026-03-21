import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Tenant-to-tenant housing
          </Badge>
          <p className="section-kicker mb-4">Apple-style calm, marketplace-speed utility</p>
          <h1 className="font-display text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl">
            Move into verified spaces faster.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
            PataSpace helps outgoing tenants publish real handovers and incoming tenants
            unlock the details that matter without wasting time on fake inventory.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition hover:bg-[var(--hig-color-accent-hover)] hover:shadow-soft-md"
            >
              Browse listings
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex h-11 items-center justify-center rounded-full border border-separator bg-card px-5 text-sm font-semibold text-foreground shadow-soft-sm transition hover:bg-surface-elevated"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-separator bg-surface px-4 py-4 backdrop-blur-xl">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Fast</p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                Quiet, direct listing discovery without noisy marketplace clutter.
              </p>
            </div>
            <div className="rounded-[24px] border border-separator bg-surface px-4 py-4 backdrop-blur-xl">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Verified</p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                GPS, photos, and video proofs help separate real spaces from fake ones.
              </p>
            </div>
            <div className="rounded-[24px] border border-separator bg-surface px-4 py-4 backdrop-blur-xl">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Focused</p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                Credits unlock only the lead you want instead of wasting money everywhere.
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
            <CardDescription>
              An Apple-inspired search shell wired to the shared semantic token set.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Neighborhood e.g. Kilimani" />
            <Input placeholder="Budget e.g. 25000" />
            <div className="flex gap-3">
              <Button className="flex-1">Search</Button>
              <Button variant="outline">Saved</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Verified by media + GPS</CardTitle>
            <CardDescription>
              Listings are captured from mobile with photos, video, and location checks.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credits unlock contacts</CardTitle>
            <CardDescription>
              Incoming tenants browse for free, then unlock the exact listing they want.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payouts after confirmation</CardTitle>
            <CardDescription>
              Outgoing tenants earn commission after both sides confirm a real connection.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}

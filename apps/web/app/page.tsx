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
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Tenant-to-tenant housing
          </Badge>
        <h1 className="text-5xl font-black tracking-tight text-stone-950 sm:text-6xl">
          Move into verified spaces faster.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
          PataSpace helps outgoing tenants list real handovers and incoming tenants
          unlock the details that matter without wasting time on fake inventory.
        </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Browse listings
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
        </div>

        <Card className="border-stone-300/80 bg-white/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
            <CardDescription>
              A lightweight search shell wired with `shadcn/ui` primitives.
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
        <Card className="border-stone-300/80 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Verified by media + GPS</CardTitle>
            <CardDescription>
              Listings are captured from mobile with photos, video, and location checks.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-stone-300/80 bg-white/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Credits unlock contacts</CardTitle>
            <CardDescription>
              Incoming tenants browse for free, then unlock the exact listing they want.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-stone-300/80 bg-white/80 shadow-sm backdrop-blur">
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

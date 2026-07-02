import Link from 'next/link';
import {
  BadgeCheck,
  Camera,
  CircleDollarSign,
  MessageSquareText,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { linkButtonClass } from '@/lib/link-button';

const steps = [
  {
    title: 'Outgoing tenant posts from mobile',
    body: 'Listings are created with GPS-backed media, structured details, and verification notes.',
    Icon: Camera,
  },
  {
    title: 'Incoming tenant browses for free',
    body: 'Renters see the listing context, media, map preview, pricing, and amenities before any paid action.',
    Icon: Wallet,
  },
  {
    title: 'Credits are funded through M-Pesa',
    body: 'Wallet top-ups create pending records first, then settle after callback or reconciliation.',
    Icon: CircleDollarSign,
  },
  {
    title: 'Unlock reveals direct contact',
    body: 'A valid unlock reveals the exact address and phone number and signals serious intent.',
    Icon: MessageSquareText,
  },
  {
    title: 'Both sides confirm the outcome',
    body: 'Confirmation records the move-in outcome inside the audited unlock timeline.',
    Icon: BadgeCheck,
  },
  {
    title: 'Disputes and refunds remain available',
    body: 'If the listing or handover outcome is invalid, the dispute path can adjust the result.',
    Icon: ShieldAlert,
  },
] as const;

export default function Page() {
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="How It Works"
        title="The renter journey, end to end"
        description="Browse, fund credits, unlock direct contact, confirm the outcome, and resolve issues in one flow."
        actions={
          <>
            <Link href="/#join" className={linkButtonClass({ size: 'sm' })}>
              Join the waitlist
            </Link>
            <Link href="/pricing" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              See pricing
            </Link>
          </>
        }
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="border border-border bg-card shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-12 items-center justify-center border border-border bg-primary/10 text-primary">
                    <step.Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  {step.title}
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  {step.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </PublicSiteFrame>
  );
}

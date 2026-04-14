import Link from 'next/link';
import {
  BadgeCheck,
  Camera,
  CircleDollarSign,
  MessageSquareText,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
            <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
              Start browsing
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
              className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
                    <step.Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8081]">
                    Step {index + 1}
                  </span>
                </div>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  {step.title}
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-[#62686a]">
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

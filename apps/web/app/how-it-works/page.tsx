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
    body: 'Listings are created through the mobile capture flow with GPS-backed media, structured details, and verification notes.',
    Icon: Camera,
  },
  {
    title: 'Incoming tenant browses for free',
    body: 'The web app exposes the listing context, media, location preview, pricing, and amenities before any paid action is required.',
    Icon: Wallet,
  },
  {
    title: 'Credits are funded through M-Pesa',
    body: 'Wallet top-ups create pending purchase records first, then settle after callback or reconciliation completes.',
    Icon: CircleDollarSign,
  },
  {
    title: 'Unlock reveals direct contact',
    body: 'A valid unlock reveals the exact address and phone number and notifies the outgoing tenant that someone is serious.',
    Icon: MessageSquareText,
  },
  {
    title: 'Both sides confirm the outcome',
    body: 'Confirmation makes the move-in outcome explicit and is part of the audited unlock timeline.',
    Icon: BadgeCheck,
  },
  {
    title: 'Disputes and refunds remain available',
    body: 'If the listing or handover outcome is invalid, the dispute path can block or change the financial result.',
    Icon: ShieldAlert,
  },
] as const;

export default function Page() {
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="How It Works"
        title="The tenant flow, end to end"
        description="The web app is designed around the incoming-tenant journey: discovery, wallet funding, contact reveal, confirmation, and dispute handling when something breaks."
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

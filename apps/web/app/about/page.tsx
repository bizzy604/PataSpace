/**
 * Purpose: Public "About" marketing page.
 * Why important: Explains the marketplace model to visitors; the product
 *   itself lives in the mobile app, so this page routes tenants there.
 * Used by: /about route.
 */
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
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
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="About PataSpace"
        title="Tenant-first rental discovery for Nairobi"
        description="Verified browsing, credits, and direct contact reveal — built around outgoing tenants handing over to incoming tenants, with no agents in between."
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

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground">
                Why this exists
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Traditional rental search often asks for commitment too early. PataSpace keeps discovery open and charges only at the decision point.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {principles.map((item) => (
                <div key={item.title} className="border border-border bg-muted p-5">
                  <p className="text-xl font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border bg-foreground text-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-background">
                Marketplace guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-background/76">
              <p>Listing capture stays mobile-first so media and location proof are stronger.</p>
              <p>Unlock pricing stays tied to rent to keep reveal value predictable.</p>
              <p>Disputes, refunds, and confirmation are handled inside the product.</p>
              <p>Commissions move only after both sides confirm the outcome.</p>
              <p className="text-background">
                Browsing and posting happen in the PataSpace mobile app; this site is the
                front door and the operations console.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

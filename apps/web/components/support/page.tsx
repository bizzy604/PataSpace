import Link from 'next/link';
import { ArrowRight, Flag, MessageCircle, PlayCircle } from 'lucide-react';
import type { SupportTicketRecord } from '@pataspace/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { SupportContactForm } from '@/components/support/contact-form';
import { supportTopics } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export function HelpCenterPage({ tickets }: { tickets: SupportTicketRecord[] }) {
  return (
    <TenantWorkspaceShell
      pathname="/support"
      title="Support"
      description="Guidance, escalation paths, and active support threads in one workspace."
      actions={
        <>
          <Link href="/support" className={linkButtonClass({ size: 'sm' })}>
            Contact support
          </Link>
          <Link href="/wallet/transactions" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Review wallet history
          </Link>
        </>
      }
    >
      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Contact support', body: 'Reach the team for urgent handover or payment questions.', Icon: MessageCircle },
                  { title: 'Report a problem', body: 'Open the dispute path if a listing or unlock outcome breaks down.', Icon: Flag },
                  { title: 'Video guides', body: 'Short explainers for wallet, unlock, and confirmation flows.', Icon: PlayCircle },
                ].map(({ title, body, Icon }) => (
                  <div key={title} className="border border-border bg-muted p-5">
                    <span className="flex size-11 items-center justify-center border border-border bg-card text-primary">
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-4 font-medium text-foreground">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  Frequently asked questions
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Common answers from the current support knowledge base.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportTopics.map((topic) => (
                  <div key={topic.title} className="border border-border bg-muted p-5">
                    <p className="font-medium text-foreground">{topic.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{topic.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  Contact support
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Sends a real ticket to the support team. You will be contacted via SMS or WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SupportContactForm />
              </CardContent>
            </Card>

            <Card className="border border-border bg-foreground text-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-background">
                  Open support threads
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-background/60">
                  Your active support work, pulled live from the backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.length === 0 ? (
                  <p className="text-sm leading-7 text-background/76">
                    No active support tickets yet. Use the form above to open one.
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-background/10 bg-background/6 p-4 text-sm leading-7 text-background/76"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-background">{ticket.subject}</p>
                        <span className="border border-background/20 px-2 py-0.5 text-xs">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-2">{ticket.message}</p>
                      <p className="mt-2 text-background/50">
                        Updated {formatDateLabel(ticket.updatedAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </TenantWorkspaceShell>
  );
}

export function WhatsNewPage() {
  return (
    <PublicSiteFrame>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl border border-border bg-card p-8 shadow-sm">
          <p className="inline-flex border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
            What's new
          </p>
          <h1 className="mt-6 text-5xl font-semibold text-foreground">
            Native workspace pages are replacing the missing Stitch mocks
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            The latest pass brings key wallet, profile, search, support, listing-detail, and unlock-detail routes into native Next.js page components so the app no longer depends on absent local Stitch exports.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Wallet and profile routes',
                body: 'Credits, transaction history, settings, and notifications now render as working web pages.',
              },
              {
                title: 'Listing and unlock detail',
                body: 'The core browse-to-unlock journey can continue without iframe-backed HTML exports.',
              },
              {
                title: 'Search, map, and support',
                body: 'Discovery and help surfaces now use the repo-native design system and mock data.',
              },
            ].map((item) => (
              <div key={item.title} className="border border-border bg-muted p-5">
                <p className="text-2xl font-semibold text-foreground">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wallet" className={linkButtonClass({ size: 'sm' })}>
              Open wallet
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/search" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
              Try search
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

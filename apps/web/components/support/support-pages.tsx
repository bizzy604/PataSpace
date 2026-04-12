import Link from 'next/link';
import { ArrowRight, Flag, MessageCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { mockSupportRequests, supportTopics } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export function HelpCenterPage() {
  return (
    <PublicSiteFrame>
      <ScreenHero
        eyebrow="Help center"
        title="Get answers before or after an unlock"
        description="The support route now mirrors the Stitch help-center intent with searchable guidance, quick escalation paths, and live thread context."
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
      />

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Contact support', body: 'Reach the team for urgent handover or payment questions.', Icon: MessageCircle },
                  { title: 'Report a problem', body: 'Open the dispute path if a listing or unlock outcome breaks down.', Icon: Flag },
                  { title: 'Video walkthroughs', body: 'Short explainers for wallet, unlock, and confirmation flows.', Icon: PlayCircle },
                ].map(({ title, body, Icon }) => (
                  <div key={title} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-5">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-4 font-medium text-[#252525]">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-[#62686a]">{body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  Frequently asked questions
                </CardTitle>
                <CardDescription className="text-sm leading-7 text-[#62686a]">
                  These topics come from the current mock support knowledge base.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportTopics.map((topic) => (
                  <div key={topic.title} className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-5">
                    <p className="font-medium text-[#252525]">{topic.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[#62686a]">{topic.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
                Open support threads
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-white/70">
                Ongoing support work stays visible beside the FAQ guidance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSupportRequests.map((request) => (
                <div key={request.id} className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-white/76">
                  <p className="font-medium text-white">{request.subject}</p>
                  <p className="mt-2">{request.summary}</p>
                  <p className="mt-2 text-white/56">Updated {formatDateLabel(request.updatedAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

export function WhatsNewPage() {
  return (
    <PublicSiteFrame>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[40px] border border-black/8 bg-[radial-gradient(circle_at_top,rgba(40,128,154,0.18),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7f4ee_100%)] p-8 shadow-[0_28px_90px_rgba(37,37,37,0.1)]">
          <p className="mx-auto inline-flex rounded-full bg-[#28809A]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
            What's new
          </p>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.08em] text-[#252525]">
            Native workspace pages are replacing the missing Stitch mocks
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62686a]">
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
              <div key={item.title} className="rounded-[28px] border border-black/8 bg-white/90 p-5">
                <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-[#62686a]">{item.body}</p>
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

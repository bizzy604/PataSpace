import Link from 'next/link';
import { ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';

const sellingPoints = [
  {
    title: 'Verified tenant context',
    body: 'Unlocks reveal direct contact only after a paid step, keeping browse free and contact private until needed.',
    Icon: ShieldCheck,
  },
  {
    title: 'M-Pesa-native wallet flow',
    body: 'Credit top-ups, refunds, and unlock spend are all modeled around the same wallet surface.',
    Icon: Wallet,
  },
  {
    title: 'Mobile-first listing capture',
    body: 'Posting stays on mobile, so the web experience can stay focused on discovery and follow-through.',
    Icon: Smartphone,
  },
] as const;

export function AuthScreenShell({
  title,
  description,
  form,
  footerPrompt,
  footerLinkLabel,
  footerLinkHref,
}: {
  title: string;
  description: string;
  form: React.ReactNode;
  footerPrompt: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}) {
  return (
    <PublicSiteFrame>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_28px_90px_rgba(37,37,37,0.18)]">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ed7e7]">
                Tenant web access
              </p>
              <CardTitle className="font-display text-4xl font-semibold tracking-[-0.07em] text-white">
                {title}
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-7 text-white/72">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {sellingPoints.map(({ title: pointTitle, body, Icon }) => (
                <div
                  key={pointTitle}
                  className="rounded-[24px] border border-white/10 bg-white/6 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[#28809A]/16 text-[#8ed7e7]">
                      <Icon className="size-5" />
                    </span>
                    <p className="font-display text-lg font-semibold tracking-[-0.04em]">
                      {pointTitle}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/70">{body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-black/8 bg-white shadow-[0_28px_90px_rgba(37,37,37,0.1)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                Continue
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[#62686a]">
                Use a Kenyan phone number and the same account across wallet,
                unlock, confirmation, and support surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {form}
              <p className="text-sm text-[#62686a]">
                {footerPrompt}{' '}
                <Link href={footerLinkHref} className="font-semibold text-[#28809A]">
                  {footerLinkLabel}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicSiteFrame>
  );
}

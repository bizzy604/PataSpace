import Link from 'next/link';
import { Mail, MessageSquareText, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIntro } from '@/components/shared/page-intro';
import { linkButtonVariants } from '@/lib/link-button';
import { supportTopics } from '@/lib/mock-app-state';

export default function SupportPage() {
  const contactChannels = [
    { label: 'Support phone', value: '+254 700 123 123', Icon: Phone },
    { label: 'Support email', value: 'support@pataspace.test', Icon: Mail },
    {
      label: 'Response mode',
      value: 'Use this route before escalating to a dispute',
      Icon: MessageSquareText,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <PageIntro
        badge="Support"
        kicker="Help and FAQ"
        title="Get help with unlocks, refunds, and payment timing."
        description="This route consolidates the support screens that make sense on web today, without copying every mobile utility page one-for-one."
        actions={
          <Link href="/unlocks" className={linkButtonVariants()}>
            Open unlock history
          </Link>
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
        <div className="space-y-4">
          {supportTopics.map((topic) => (
            <Card key={topic.title} className="bg-surface-elevated shadow-soft-md">
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5 text-sm leading-7 text-foreground-secondary">
                {topic.body}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Contact channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            {contactChannels.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/6 px-4 py-4"
              >
                <div className="mt-1 flex size-9 items-center justify-center rounded-full bg-white/10 text-[#67d1e3]">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="mt-2 leading-6">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

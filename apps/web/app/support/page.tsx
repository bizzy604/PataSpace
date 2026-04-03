import Link from 'next/link';
import { LifeBuoy, Mail, MessageSquareMore } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { mockSupportRequests, supportTopics } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  const openRequests = mockSupportRequests.filter((request) => request.status !== 'RESOLVED').length;

  return (
    <TenantWorkspaceShell
      pathname="/support"
      title="Support"
      description="Help topics, contact channels, and prior support requests connected to wallet, unlock, and dispute activity."
      actions={
        <Link href="/profile" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Profile
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Open requests"
          value={`${openRequests}`}
          hint="Support conversations that still need follow-up or resolution."
          Icon={LifeBuoy}
        />
        <MetricCard
          label="WhatsApp support"
          value="24/7"
          hint="The fastest path for payment delays and urgent unlock guidance."
          Icon={MessageSquareMore}
        />
        <MetricCard
          label="Email support"
          value="support@pataspace.co.ke"
          hint="Best for longer dispute write-ups and attachments."
          Icon={Mail}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Help topics
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Fast answers for the most common tenant-side questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportTopics.map((topic) => (
              <div
                key={topic.title}
                className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
              >
                <p className="font-medium text-[#252525]">{topic.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#62686a]">{topic.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              Previous requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSupportRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#252525]">{request.subject}</p>
                  <span className="rounded-full border border-black/8 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#4b4f50]">
                    {request.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#62686a]">{request.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#7b8081]">
                  {request.channel} • updated {formatDateLabel(request.updatedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

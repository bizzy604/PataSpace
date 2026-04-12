import Link from 'next/link';
import { Bell, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { linkButtonClass } from '@/lib/link-button';

const notificationGroups = [
  {
    label: 'Today',
    items: [
      {
        title: 'Unlock awaiting confirmation',
        body: 'Sunny 2BR handover near Yaya Centre is waiting on the current tenant response.',
        tone: 'warning' as const,
        href: '/unlocks/unlock-1',
      },
      {
        title: 'Product update available',
        body: 'A new feature announcement is ready in the tenant workspace.',
        tone: 'brand' as const,
        href: '/whats-new',
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        title: 'Wallet top-up completed',
        body: 'Fast Track purchase posted successfully to your wallet ledger.',
        tone: 'positive' as const,
        href: '/wallet/transactions/txn-1',
      },
    ],
  },
  {
    label: 'This week',
    items: [
      {
        title: 'Support follow-up',
        body: 'Operations responded to your M-Pesa prompt question via WhatsApp.',
        tone: 'neutral' as const,
        href: '/support',
      },
    ],
  },
] as const;

export function NotificationsPage() {
  const notificationCount = notificationGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Notifications"
      description="Grouped updates for wallet activity, unlocks, support follow-through, and product announcements."
      actions={
        <>
          <Link href="/settings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Notification settings
          </Link>
          <Link href="/whats-new" className={linkButtonClass({ size: 'sm' })}>
            View announcement
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <Card key={group.label} className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  {group.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 transition hover:border-[#28809A]/24 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={item.tone === 'positive' ? 'Payments' : item.tone === 'warning' ? 'Unlocks' : item.tone === 'brand' ? 'Product' : 'Support'}
                        tone={item.tone}
                      />
                    </div>
                    <p className="mt-3 font-medium text-[#252525]">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[#62686a]">{item.body}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Notification health
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Signals stay focused on actions that affect wallet balance, unlock state, or next-step follow-through.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricCard
              label="Unread"
              value="2"
              hint="Recent unlock and product activity still needs acknowledgement."
              Icon={Bell}
            />
            <MetricCard
              label="This week"
              value={`${notificationCount}`}
              hint="Combined wallet, support, and announcement notifications currently shown."
              Icon={MessageCircle}
            />
            <div className="rounded-[24px] border border-black/8 bg-[#f7f4ee] p-4 text-sm leading-7 text-[#4b4f50]">
              Notification filters and destructive actions are not interactive yet, but the route now mirrors the structure of the Stitch concept as a working native web page.
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

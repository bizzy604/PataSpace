/**
 * Purpose: Server route for the tenant referrals workspace.
 * Why important: Surfaces the invite history (INVITED → JOINED → REWARDED)
 *   alongside an invite form so users can track and grow their referrals.
 * Used by: Next.js routing for /referrals.
 */
import Link from 'next/link';
import { Coins, Users, UserPlus2 } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import type { ReferralRecord } from '@pataspace/contracts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { ReferralInviteForm } from '@/components/referrals/invite-form';
import { getMyReferrals } from '@/lib/api/referrals';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

function statusTone(status: ReferralRecord['status']): 'positive' | 'brand' | 'warning' | 'neutral' {
  if (status === 'REWARDED') return 'positive';
  if (status === 'JOINED') return 'brand';
  if (status === 'INVITED') return 'warning';
  return 'neutral';
}

function statusBody(record: ReferralRecord): string {
  if (record.status === 'REWARDED' && record.rewardedAt) {
    return `Rewarded ${formatDateLabel(record.rewardedAt)} — bonus credits delivered to your wallet.`;
  }
  if (record.status === 'JOINED' && record.joinedAt) {
    return `Joined ${formatDateLabel(record.joinedAt)} — reward triggers on their first credit purchase.`;
  }
  if (record.status === 'INVITED') {
    return `Invite sent ${formatDateLabel(record.createdAt)} — waiting for them to register.`;
  }
  return `Invite expired ${formatDateLabel(record.createdAt)}.`;
}

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const referrals: ReferralRecord[] = await getMyReferrals(token, 1, 50)
    .then((response) => response.data)
    .catch(() => []);

  const rewardedCount = referrals.filter((entry) => entry.status === 'REWARDED').length;
  const joinedCount = referrals.filter((entry) => entry.status === 'JOINED').length;

  return (
    <TenantWorkspaceShell
      pathname="/referrals"
      title="Referrals"
      description="Invite friends to PataSpace. You earn bonus credits when they complete their first credit purchase."
      actions={
        <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Open wallet
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Invites"
          value={`${referrals.length}`}
          hint="Friends you have invited to date."
          Icon={UserPlus2}
        />
        <MetricCard
          label="Joined"
          value={`${joinedCount}`}
          hint="Invitees who have registered but not yet purchased."
          Icon={Users}
        />
        <MetricCard
          label="Rewarded"
          value={`${rewardedCount}`}
          hint="Invites that have already credited your wallet."
          Icon={Coins}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">
              Invite a friend
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Use the same phone number they will register with on PataSpace. We never reveal
              the full number back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferralInviteForm />
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">
              Your invites
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-background/60">
              Pulled live from the backend referral ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.length === 0 ? (
              <p className="text-sm leading-7 text-background/76">
                No invites yet — use the form to send your first one.
              </p>
            ) : (
              referrals.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-background/10 bg-background/6 p-4 text-sm leading-7 text-background/76"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-background">{entry.inviteePhoneMasked}</p>
                    <StatusBadge label={entry.status} tone={statusTone(entry.status)} />
                  </div>
                  <p className="mt-2">{statusBody(entry)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

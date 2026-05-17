'use client';
/**
 * Purpose: Profile overview page — shows user identity, unlock count, and wallet lifetime stats.
 * Why important: Central tenant identity surface connecting wallet, unlock, and support data.
 * Used by: components/profile/page.tsx (re-export barrel).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { CreditCard, MessageCircle, Settings2, ShieldCheck, UserCircle2, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';
import { fetchCreditBalance } from '@/lib/api/credits';
import { fetchMyUnlocks } from '@/lib/api/unlocks';
import type { CreditBalance } from '@pataspace/contracts';

const profileRows = [
  { label: 'Edit profile', href: '/profile/edit', description: 'Update your personal details, email, and public bio.', Icon: UserCircle2 },
  { label: 'Wallet history', href: '/wallet/transactions', description: 'Review purchases, unlock deductions, and refunds.', Icon: CreditCard },
  { label: 'Notification center', href: '/notifications', description: 'Track unlock, payment, and product activity.', Icon: MessageCircle },
  { label: 'Settings', href: '/settings', description: 'Control privacy, security, and notification preferences.', Icon: Settings2 },
  { label: 'Help center', href: '/support', description: 'Open FAQs, support options, and existing support threads.', Icon: MessageCircle },
] as const;

export function ProfileOverviewPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [unlockCount, setUnlockCount] = useState(0);

  useEffect(() => {
    fetchCreditBalance(getToken).then(setBalance).catch(() => null);
    fetchMyUnlocks(getToken).then((r) => setUnlockCount(r.pagination.total)).catch(() => null);
  }, [getToken]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;
  const joinedLabel = user?.createdAt ? formatDateLabel(user.createdAt.toISOString()) : '—';

  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Profile"
      description="Manage the tenant identity that powers wallet funding, unlock history, confirmations, and support."
      actions={
        <>
          <Link href="/profile/edit" className={linkButtonClass({ size: 'sm' })}>Edit profile</Link>
          <Link href="/settings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>Settings</Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader className="items-center text-center">
            <Avatar size="lg" className="size-24">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525]">
              {user?.firstName} {user?.lastName}
            </CardTitle>
            <CardDescription className="space-y-1 text-sm text-[#62686a]">
              <p>{user?.primaryEmailAddress?.emailAddress ?? '—'}</p>
              <p>Joined {joinedLabel}</p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Unlocks" value={`${unlockCount}`} hint="Paid reveals attached to this tenant account." Icon={Wallet} />
              <MetricCard label="Support threads" value="0" hint="Open and resolved support threads." Icon={MessageCircle} />
              <MetricCard label="Lifetime wallet" value={balance ? formatKes(balance.lifetimeEarned) : '—'} hint="Total credits funded or restored." Icon={ShieldCheck} />
            </div>
            <div className="rounded-[24px] border border-[#28809A]/14 bg-[#28809A]/6 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">Verification</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={user ? 'Account active' : 'Loading…'} tone="positive" />
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4b4f50]">
                This account is the shared identity used across Clerk sign-in, wallet top-ups, unlock timelines, and support escalation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">Workspace shortcuts</CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Quick links to the wallet, unlock history, and account management areas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileRows.map(({ label, href, description, Icon }) => (
              <Link key={href} href={href} className="flex items-start gap-4 rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 transition hover:border-[#28809A]/24 hover:bg-white">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[#252525]">{label}</p>
                  <p className="mt-1 text-sm leading-7 text-[#62686a]">{description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

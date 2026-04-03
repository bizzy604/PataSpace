import Link from 'next/link';
import { BadgeCheck, Phone, User2, Wallet2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { mockCurrentUser, mockUnlocks, mockTransactions } from '@/lib/mock-app-state';
import { formatDateLabel } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

export default function Page() {
  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Profile"
      description="Account identity, verification state, and the usage signals that connect wallet, unlock, and support history."
      actions={
        <Link href="/support" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Contact support
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Verified phone"
          value={mockCurrentUser.phoneVerified ? 'Verified' : 'Pending'}
          hint="Phone verification is required for protected wallet and unlock actions."
          Icon={BadgeCheck}
        />
        <MetricCard
          label="Unlock records"
          value={`${mockUnlocks.length}`}
          hint="All post-contact follow-through stays tied to these unlock records."
          Icon={Wallet2}
        />
        <MetricCard
          label="Ledger entries"
          value={`${mockTransactions.length}`}
          hint="Wallet purchases, spend, and refunds remain visible from the profile context too."
          Icon={Phone}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Account identity
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Web profile data mirrors the auth and account payloads already modeled in the backend spec.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'First name', value: mockCurrentUser.firstName },
              { label: 'Last name', value: mockCurrentUser.lastName },
              { label: 'Phone number', value: mockCurrentUser.phoneNumber },
              { label: 'Email', value: mockCurrentUser.email },
              { label: 'Role', value: mockCurrentUser.role },
              { label: 'Joined', value: formatDateLabel(mockCurrentUser.createdAt) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">
                  {item.label}
                </p>
                <p className="mt-2 font-medium text-[#252525]">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Account posture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <User2 className="size-4 text-[#8ed7e7]" />
              What the profile unlocks
            </p>
            <p>Phone verification gates wallet funding and contact reveal.</p>
            <p>Transaction and unlock history remain available for audits and support.</p>
            <p>Any changes to phone-number identity route through support for stronger account protection.</p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

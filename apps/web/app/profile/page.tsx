import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyStat } from '@/components/shared/key-stat';
import { PageIntro } from '@/components/shared/page-intro';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonVariants } from '@/lib/link-button';
import { mockCreditBalance, mockCurrentUser, mockUnlocks } from '@/lib/mock-app-state';

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        badge="Profile"
        kicker="Tenant dashboard"
        title={`${mockCurrentUser.firstName} ${mockCurrentUser.lastName}`}
        description="The profile route acts as the current tenant dashboard for the web app, connecting user identity, wallet state, unlocks, and support."
        actions={
          <>
            <Link href="/wallet" className={linkButtonVariants()}>
              Open wallet
            </Link>
            <Link href="/unlocks" className={linkButtonVariants({ variant: 'outline' })}>
              View unlocks
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KeyStat label="Phone verified" value={mockCurrentUser.phoneVerified ? 'Yes' : 'No'} />
        <KeyStat label="Credits" value={formatKes(mockCreditBalance.balance)} />
        <KeyStat label="Unlock history" value={`${mockUnlocks.length} records`} />
        <KeyStat label="Joined" value={formatDateLabel(mockCurrentUser.createdAt)} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-surface-elevated shadow-soft-md">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-foreground-secondary">
            {[
              ['Phone number', mockCurrentUser.phoneNumber],
              ['Email', mockCurrentUser.email],
              ['Role', mockCurrentUser.role],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-[22px] border border-separator bg-fill-soft px-4 py-3"
              >
                <span>{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#252525] text-white shadow-soft-lg">
          <CardHeader>
            <CardTitle className="text-white">Quick web actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm text-white/78">
            {[
              ['Browse listings', '/listings'],
              ['Buy credits', '/wallet/buy'],
              ['Confirmation and disputes', '/unlocks'],
              ['Support', '/support'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 transition hover:bg-white/10"
              >
                <span>{label}</span>
                <span className="text-[#67d1e3]">Open</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

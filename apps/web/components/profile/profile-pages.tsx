import Link from 'next/link';
import {
  CreditCard,
  LockKeyhole,
  MessageCircle,
  Settings2,
  ShieldCheck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MetricCard } from '@/components/shared/metric-card';
import { StatusBadge, unlockStatusMeta } from '@/components/shared/status-badge';
import { TenantWorkspaceShell } from '@/components/workspace/tenant-workspace-shell';
import {
  mockCreditBalance,
  mockCurrentUser,
  mockSupportRequests,
  mockUnlocks,
} from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';
import { linkButtonClass } from '@/lib/link-button';

const profileRows = [
  { label: 'Edit profile', href: '/profile/edit', description: 'Update your personal details, email, and public bio.', Icon: UserCircle2 },
  { label: 'Wallet history', href: '/wallet/transactions', description: 'Review purchases, unlock deductions, and refunds.', Icon: CreditCard },
  { label: 'Notification center', href: '/notifications', description: 'Track unlock, payment, and product activity.', Icon: MessageCircle },
  { label: 'Settings', href: '/settings', description: 'Control privacy, security, and notification preferences.', Icon: Settings2 },
  { label: 'Help center', href: '/support', description: 'Open FAQs, support options, and existing support threads.', Icon: MessageCircle },
] as const;

export function ProfileOverviewPage() {
  const latestUnlock = mockUnlocks[0];
  const joinedLabel = formatDateLabel(mockCurrentUser.createdAt);

  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Profile"
      description="Manage the tenant identity that powers wallet funding, unlock history, confirmations, and support."
      actions={
        <>
          <Link href="/profile/edit" className={linkButtonClass({ size: 'sm' })}>
            Edit profile
          </Link>
          <Link href="/settings" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
            Settings
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader className="items-center text-center">
            <Avatar size="lg" className="size-24">
              <AvatarFallback>
                {mockCurrentUser.firstName[0]}
                {mockCurrentUser.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525]">
              {mockCurrentUser.firstName} {mockCurrentUser.lastName}
            </CardTitle>
            <CardDescription className="space-y-1 text-sm text-[#62686a]">
              <p>{mockCurrentUser.phoneNumber}</p>
              <p>Joined {joinedLabel}</p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Unlocks"
                value={`${mockUnlocks.length}`}
                hint="Paid reveals currently attached to this tenant account."
                Icon={Wallet}
              />
              <MetricCard
                label="Support threads"
                value={`${mockSupportRequests.length}`}
                hint="Open and resolved follow-up threads tied to wallet and unlock actions."
                Icon={MessageCircle}
              />
              <MetricCard
                label="Lifetime wallet"
                value={formatKes(mockCreditBalance.lifetimeEarned)}
                hint="Total credits funded or restored through purchases and refunds."
                Icon={ShieldCheck}
              />
            </div>

            <div className="rounded-[24px] border border-[#28809A]/14 bg-[#28809A]/6 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">Verification</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={mockCurrentUser.phoneVerified ? 'Phone verified' : 'Verification pending'} tone={mockCurrentUser.phoneVerified ? 'positive' : 'warning'} />
                {latestUnlock ? <StatusBadge label={unlockStatusMeta(latestUnlock.status).label} tone={unlockStatusMeta(latestUnlock.status).tone} /> : null}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4b4f50]">
                This account is the shared identity used across OTP verification, wallet top-ups, unlock timelines, and support escalation.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Workspace shortcuts
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              The Stitch profile concepts are now represented as native web cards and routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileRows.map(({ label, href, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-start gap-4 rounded-[24px] border border-black/8 bg-[#fbfaf7] p-4 transition hover:border-[#28809A]/24 hover:bg-white"
              >
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

export function ProfileEditPage() {
  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Edit profile"
      description="Update your personal information while keeping the verified phone number and wallet identity intact."
      actions={
        <Link href="/profile" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to profile
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
              Personal details
            </CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Changes here should stay consistent with wallet, unlock, and support records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#252525]">
                First name
                <Input className="h-11 rounded-2xl" defaultValue={mockCurrentUser.firstName} />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#252525]">
                Last name
                <Input className="h-11 rounded-2xl" defaultValue={mockCurrentUser.lastName} />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-[#252525]">
              Verified phone number
              <Input className="h-11 rounded-2xl bg-[#f7f4ee]" readOnly defaultValue={mockCurrentUser.phoneNumber} />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#252525]">
              Email address
              <Input className="h-11 rounded-2xl" defaultValue={mockCurrentUser.email} />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#252525]">
              About me
              <Textarea
                className="min-h-36 rounded-[24px]"
                defaultValue="House-hunting from the Nairobi CBD side and usually comparing commute, building management, and move-in timing before I unlock."
              />
            </label>

            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Verification and identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <ShieldCheck className="size-4 text-[#8ed7e7]" />
              Verified phone number
            </p>
            <p>Your primary phone number is read-only here so the wallet and unlock audit trail stays stable.</p>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              Uploading identity evidence is still optional, but it can support future trust indicators and faster support resolution.
            </div>
            <Link href="/support" className={linkButtonClass({ size: 'sm' })}>
              Contact support for phone changes
            </Link>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

export function SettingsPage() {
  const sections = [
    {
      title: 'Notifications',
      rows: [
        ['Push notifications', 'Enabled'],
        ['Unlock updates', 'Enabled'],
        ['Confirmation reminders', 'Enabled'],
        ['Marketing messages', 'Muted'],
      ],
    },
    {
      title: 'Privacy',
      rows: [
        ['Phone number visibility', 'Private until unlock'],
        ['Profile visibility', 'Workspace only'],
        ['Location services', 'Approximate area only'],
      ],
    },
    {
      title: 'Security',
      rows: [
        ['Change password', 'Available'],
        ['Two-factor authentication', 'Planned'],
        ['Biometric sign-in', 'Device dependent'],
      ],
    },
    {
      title: 'Preferences',
      rows: [
        ['Language', 'English'],
        ['Currency display', 'KES'],
        ['Color mode', 'Light'],
      ],
    },
  ] as const;

  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Settings"
      description="Control notification, privacy, and security preferences for the tenant workspace."
      actions={
        <Link href="/profile" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
          Back to profile
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title} className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/8 bg-[#fbfaf7] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-[#252525]">{label}</span>
                    <span className="text-[#62686a]">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Security notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <LockKeyhole className="size-4 text-[#8ed7e7]" />
              Sensitive contact stays protected
            </p>
            <p>
              Public profile details stay lightweight because address, phone number, and exact map data are still protected behind the unlock step.
            </p>
            <p>
              Settings here are designed to support that same privacy model while keeping notifications useful for payments, unlocks, and support follow-up.
            </p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

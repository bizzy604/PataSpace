'use client';
/**
 * Purpose: Profile page barrel — re-exports all profile page components.
 * Why important: Keeps app route imports stable while sub-modules stay independently sized.
 * Used by: app/profile/page.tsx, app/profile/edit/page.tsx, app/settings/page.tsx.
 */
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { linkButtonClass } from '@/lib/link-button';

export { ProfileOverviewPage } from './profile-overview';
export { ProfileEditPage } from './profile-edit';

const settingsSections = [
  { title: 'Notifications', rows: [['Push notifications', 'Enabled'], ['Unlock updates', 'Enabled'], ['Confirmation reminders', 'Enabled'], ['Marketing messages', 'Muted']] },
  { title: 'Privacy', rows: [['Phone number visibility', 'Private until unlock'], ['Profile visibility', 'Workspace only'], ['Location services', 'Approximate area only']] },
  { title: 'Security', rows: [['Change password', 'Available'], ['Two-factor authentication', 'Planned'], ['Biometric sign-in', 'Device dependent']] },
  { title: 'Preferences', rows: [['Language', 'English'], ['Currency display', 'KES'], ['Color mode', 'Light']] },
] as const;

export function SettingsPage() {
  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Settings"
      description="Control notification, privacy, and security preferences for the tenant workspace."
      actions={<Link href="/profile" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>Back to profile</Link>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title} className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.rows.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/8 bg-[#fbfaf7] px-4 py-3 text-sm">
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
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">Security notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <LockKeyhole className="size-4 text-[#8ed7e7]" /> Sensitive contact stays protected
            </p>
            <p>Address, phone number, and exact map data are protected behind the unlock step.</p>
            <p>Settings here support that same privacy model while keeping notifications useful for payments, unlocks, and support follow-up.</p>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

'use client';
/**
 * Purpose: Profile edit page — allows tenants to update name and email via Clerk UserProfile.
 * Why important: Keeps profile edits in sync with Clerk identity and the backend user record.
 * Used by: components/profile/page.tsx (re-export barrel).
 */
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TenantWorkspaceShell } from '@/components/workspace/page';
import { linkButtonClass } from '@/lib/link-button';

export function ProfileEditPage() {
  const { user } = useUser();

  return (
    <TenantWorkspaceShell
      pathname="/profile"
      title="Edit profile"
      description="Update your personal information while keeping the verified account identity intact."
      actions={<Link href="/profile" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>Back to profile</Link>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">Personal details</CardTitle>
            <CardDescription className="text-sm leading-7 text-[#62686a]">
              Changes here stay consistent with wallet, unlock, and support records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#252525]">
                First name
                <Input className="h-11 rounded-2xl" defaultValue={user?.firstName ?? ''} />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#252525]">
                Last name
                <Input className="h-11 rounded-2xl" defaultValue={user?.lastName ?? ''} />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              Email address
              <Input className="h-11 rounded-2xl" defaultValue={user?.primaryEmailAddress?.emailAddress ?? ''} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[#252525]">
              About me
              <Textarea className="min-h-36 rounded-[24px]" defaultValue="House-hunting from the Nairobi CBD side and usually comparing commute, building management, and move-in timing before I unlock." />
            </label>
            <Button className="h-11 rounded-full bg-[#28809A] px-6 text-white hover:bg-[#21687d]">Save changes</Button>
          </CardContent>
        </Card>

        <Card className="border border-black/8 bg-[#252525] text-white shadow-[0_24px_80px_rgba(37,37,37,0.18)]">
          <CardHeader>
            <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">Verification and identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/76">
            <p className="inline-flex items-center gap-2 font-medium text-white">
              <ShieldCheck className="size-4 text-[#8ed7e7]" /> Clerk-managed identity
            </p>
            <p>Your account is managed through Clerk. For identity changes such as phone number updates, use the account settings in your Clerk profile.</p>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
              Uploading identity evidence is optional, but it can support future trust indicators and faster support resolution.
            </div>
            <Link href="/support" className={linkButtonClass({ size: 'sm' })}>Contact support</Link>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

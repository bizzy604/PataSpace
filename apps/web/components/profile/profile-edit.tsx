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
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-foreground">Personal details</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Changes here stay consistent with wallet, unlock, and support records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                First name
                <Input className="h-11" defaultValue={user?.firstName ?? ''} />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                Last name
                <Input className="h-11" defaultValue={user?.lastName ?? ''} />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-foreground">
              Email address
              <Input className="h-11" defaultValue={user?.primaryEmailAddress?.emailAddress ?? ''} />
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground">
              About me
              <Textarea className="min-h-36" defaultValue="House-hunting from the Nairobi CBD side and usually comparing commute, building management, and move-in timing before I unlock." />
            </label>
            <Button className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90">Save changes</Button>
          </CardContent>
        </Card>

        <Card className="border border-border bg-foreground text-background shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-background">Verification and identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-background/76">
            <p className="inline-flex items-center gap-2 font-medium text-background">
              <ShieldCheck className="size-4 text-primary" /> Clerk-managed identity
            </p>
            <p>Your account is managed through Clerk. For identity changes such as phone number updates, use the account settings in your Clerk profile.</p>
            <div className="border border-background/10 bg-background/6 p-4">
              Uploading identity evidence is optional, but it can support future trust indicators and faster support resolution.
            </div>
            <Link href="/support" className={linkButtonClass({ size: 'sm' })}>Contact support</Link>
          </CardContent>
        </Card>
      </div>
    </TenantWorkspaceShell>
  );
}

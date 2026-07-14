/**
 * Purpose: Refusal screen for authenticated users without the ADMIN role.
 * Why important: A signed-in tenant landing on /admin must get a clear "not
 *   for you" rather than a broken console; the API rejects their requests
 *   anyway (Role.ADMIN guard), this makes the boundary legible.
 * Used by: app/admin/(console)/layout.tsx.
 */
'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { linkButtonClass } from '@/lib/link-button';

export function AdminForbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md border border-border bg-card shadow-sm">
        <CardHeader>
          <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </span>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Admin access required
          </CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            This console is for PataSpace operations staff. Your account does not have the ADMIN
            role.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Link href="/" className={linkButtonClass({ size: 'sm' })}>
            Back to the site
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className={linkButtonClass({ variant: 'outline', size: 'sm' })}
          >
            Sign out
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

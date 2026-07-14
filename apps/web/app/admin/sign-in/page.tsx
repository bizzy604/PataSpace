/**
 * Purpose: Admin console sign-in screen — email + password credentials form.
 * Why important: The only authentication entry point on the web app; tenants
 *   sign in on mobile, admins sign in here.
 * Used by: /admin/sign-in route; proxy.ts redirects unauthenticated or
 *   non-admin /admin traffic to this page.
 */
import { Suspense } from 'react';
import { AdminSignInForm } from '@/components/admin/admin-sign-in-form';

export const metadata = {
  title: 'PataSpace | Admin sign in',
};

export default function AdminSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            PataSpace operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Admin sign in</h1>
        </div>
        {/* AdminSignInForm reads useSearchParams() (the post-login callbackUrl);
            a Suspense boundary is required so this page can still be statically
            prerendered instead of bailing the whole route to client rendering. */}
        <Suspense fallback={<div className="h-[260px] w-full max-w-sm" aria-hidden />}>
          <AdminSignInForm />
        </Suspense>
      </div>
    </div>
  );
}

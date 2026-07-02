/**
 * Purpose: Clerk sign-in screen for the admin console.
 * Why important: The only authentication entry point on the web app; tenants
 *   sign in on mobile, admins sign in here.
 * Used by: /admin/sign-in route; middleware redirects unauthenticated /admin
 *   traffic to this page.
 */
import { SignIn } from '@clerk/nextjs';

export default function AdminSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            PataSpace operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Admin sign in</h1>
        </div>
        <SignIn forceRedirectUrl="/admin" />
      </div>
    </div>
  );
}

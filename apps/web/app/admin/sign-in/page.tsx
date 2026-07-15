/**
 * Purpose: Admin console sign-in screen — a two-panel layout with a branded
 *   dark panel (carrying the PataSpace logo) and the email + password form.
 * Why important: The only authentication entry point on the web app; tenants
 *   sign in on mobile, admins sign in here. First impression of the console.
 * Used by: /admin/sign-in route; proxy.ts redirects unauthenticated or
 *   non-admin /admin traffic to this page.
 */
import Image from 'next/image';
import { Suspense } from 'react';
import { AdminSignInForm } from '@/components/admin/admin-sign-in-form';

export const metadata = {
  title: 'PataSpace | Admin sign in',
};

const HIGHLIGHTS = [
  'Moderate listings and resolve disputes',
  'Reconcile M-Pesa payouts and success fees',
  'Work the support queue and audit every action',
];

export default function AdminSignInPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — the logo PNG is a glow-on-dark asset, so it lives here. */}
      <aside className="relative hidden overflow-hidden bg-[rgb(9,26,33)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 55% at 22% 18%, rgba(103,209,227,0.20), transparent 60%), radial-gradient(55% 50% at 88% 92%, rgba(40,128,154,0.26), transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative">
          <Image
            src="/brand/pataspace-logo.png"
            alt="PataSpace"
            width={176}
            height={176}
            priority
            className="h-44 w-44 object-contain"
          />
        </div>

        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[rgb(103,209,227)]">
            Operations console
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white">
            Run the marketplace with confidence.
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(103,209,227)]/15 text-[rgb(103,209,227)]">
                  <svg
                    viewBox="0 0 16 16"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 8.5 6.5 12 13 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Restricted access · PataSpace administrators only
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* On small screens the dark brand panel is hidden, so the glow-on-dark
              logo shows inside a dark badge to sit on its intended background. */}
          <div className="mb-10 flex justify-center lg:hidden">
            <div className="rounded-2xl bg-[rgb(9,26,33)] p-3 shadow-sm">
              <Image
                src="/brand/pataspace-logo.png"
                alt="PataSpace"
                width={96}
                height={96}
                priority
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to the PataSpace operations console.
            </p>
          </div>

          {/* AdminSignInForm reads useSearchParams() (the post-login callbackUrl);
              a Suspense boundary is required so this page can still be statically
              prerendered instead of bailing the whole route to client rendering. */}
          <Suspense fallback={<div className="h-[300px] w-full" aria-hidden />}>
            <AdminSignInForm />
          </Suspense>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact a PataSpace administrator.
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * Purpose: Navigation shell for the admin console — top bar with section
 *   links, the signed-in admin's identity, and sign-out.
 * Why important: Every admin page renders inside this frame; navigation and
 *   session controls live in exactly one place.
 * Used by: app/admin/layout.tsx.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, UserButton } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';
import { linkButtonClass } from '@/lib/link-button';

const sections = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Listings', href: '/admin/listings' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Finance', href: '/admin/finance' },
  { label: 'Support', href: '/admin/support' },
  { label: 'Disputes', href: '/admin/disputes' },
] as const;

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-3 md:px-10">
          <div className="flex items-center gap-6">
            <Link href="/admin" aria-label="Admin dashboard" className="inline-flex items-center">
              <BrandLogo compact />
            </Link>
            <nav className="flex items-center gap-1">
              {sections.map((section) => {
                const isActive =
                  section.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(section.href);

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition',
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{adminName}</span>
            <div className="rounded-lg border border-border bg-card p-1 shadow-sm">
              <UserButton />
            </div>
            <SignOutButton>
              <button
                type="button"
                className={linkButtonClass({ variant: 'outline', size: 'sm' })}
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { LayoutDashboard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';
import { linkButtonClass } from '@/lib/link-button';

const footerLinks = [
  { label: 'Listings', href: '/listings' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Support', href: '/support' },
  { label: 'Open workspace', href: '/wallet' },
] as const;

export function PublicSiteFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const showSignedIn = isLoaded && isSignedIn;
  const showSignedOut = isLoaded && !isSignedIn;
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16">
          <Link href="/" aria-label="PataSpace home" className="inline-flex shrink-0 items-center">
            <BrandLogo priority />
          </Link>

          <div className="flex items-center gap-2.5">
            {showSignedIn && (
              <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                <LayoutDashboard className="size-4" />
                Workspace
              </Link>
            )}
            {showSignedOut && (
              <SignUpButton mode="redirect">
                <button type="button" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  <UserPlus className="size-4" />
                  Register
                </button>
              </SignUpButton>
            )}
            {showSignedOut && (
              <SignInButton mode="redirect">
                <button type="button" className={linkButtonClass({ size: 'sm' })}>
                  <LogIn className="size-4" />
                  Sign in
                </button>
              </SignInButton>
            )}
            {showSignedIn && (
              <div className="rounded-lg border border-border bg-card p-1 shadow-sm">
                <UserButton />
              </div>
            )}
            {showSignedIn && (
              <SignOutButton>
                <button type="button" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </SignOutButton>
            )}
          </div>
        </div>
      </header>

      <div className="relative">{children}</div>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <BrandLogo compact />
            <p className="text-sm text-muted-foreground">
              Tenant-first housing discovery for Nairobi.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

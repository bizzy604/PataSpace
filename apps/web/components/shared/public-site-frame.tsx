/**
 * Purpose: Header/footer frame for the public marketing pages.
 * Why important: The web app is landing + admin only; this frame carries the
 *   marketing nav and the single entry point into the admin console.
 * Used by: /about, /how-it-works, /pricing pages.
 */
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';
import { linkButtonClass } from '@/lib/link-button';

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
] as const;

export function PublicSiteFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { status } = useSession();
  const showSignedIn = status === 'authenticated';
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16">
          <Link href="/" aria-label="PataSpace home" className="inline-flex shrink-0 items-center">
            <BrandLogo priority />
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {showSignedIn ? (
              <Link href="/admin" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                <LayoutDashboard className="size-4" />
                Admin console
              </Link>
            ) : (
              <Link href="/admin" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                <LogIn className="size-4" />
                Admin sign in
              </Link>
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
              Tenant-first housing discovery for Nairobi. Get the mobile app to browse and post.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {navLinks.map((link) => (
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

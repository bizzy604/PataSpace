'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/listings', label: 'Browse' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-background/84 shadow-soft-sm backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-foreground">
          <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-separator bg-surface-elevated shadow-soft-sm">
            <Image
              src="/brand/pataspace-logo.png"
              alt="PataSpace"
              fill
              className="object-contain p-1.5"
              sizes="48px"
            />
          </span>
          <span className="font-display text-2xl font-bold tracking-[-0.04em]">PataSpace</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground',
                  active && 'text-primary',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/auth/sign-in"
            className="hidden h-11 items-center justify-center rounded-full border border-separator bg-card px-5 text-sm font-semibold text-foreground shadow-soft-sm transition-colors hover:bg-surface-elevated sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-transform hover:-translate-y-0.5 hover:bg-[var(--hig-color-accent-hover)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

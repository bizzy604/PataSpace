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
import { signOut } from 'next-auth/react';
import {
  Gauge,
  Home,
  LifeBuoy,
  LogOut,
  ScrollText,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { cn } from '@/lib/utils';
import { linkButtonClass } from '@/lib/link-button';

const sections = [
  { label: 'Dashboard', href: '/admin', icon: Gauge },
  { label: 'Listings', href: '/admin/listings', icon: Home },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Finance', href: '/admin/finance', icon: Wallet },
  { label: 'Support', href: '/admin/support', icon: LifeBuoy },
  { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
  { label: 'Audit logs', href: '/admin/audit-logs', icon: ScrollText },
  { label: 'Config', href: '/admin/config', icon: SlidersHorizontal },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

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
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-2.5 md:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              aria-label="Admin dashboard"
              className="inline-flex shrink-0 items-center gap-2"
            >
              <BrandLogo compact />
              <span className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:inline">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
              >
                {initials(adminName)}
              </span>
              <span className="max-w-[14ch] truncate text-sm text-muted-foreground">
                {adminName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: '/' })}
              className={linkButtonClass({ variant: 'outline', size: 'sm' })}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Admin sections"
          className="mx-auto w-full max-w-[1400px] overflow-x-auto px-6 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-0.5">
            {sections.map((section) => {
              const isActive =
                section.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(section.href);
              const Icon = section.icon;

              return (
                <li key={section.href} className="shrink-0">
                  <Link
                    href={section.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative inline-flex items-center gap-1.5 rounded-t-md px-2.5 pt-1.5 pb-2.5 text-sm transition-colors',
                      'after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors',
                      isActive
                        ? 'font-semibold text-foreground after:bg-primary'
                        : 'text-muted-foreground after:bg-transparent hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('size-4', isActive ? 'text-primary' : 'opacity-70')} />
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-7 md:px-10">{children}</main>
    </div>
  );
}

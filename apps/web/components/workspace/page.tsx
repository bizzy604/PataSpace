"use client";
/**
 * Purpose: Authenticated workspace layout shell — sidebar nav, balance display, and user identity.
 * Why important: Wraps every authenticated screen; provides consistent chrome and real-time balance.
 * Used by: All pages under /wallet, /profile, /unlocks, /saved, /notifications, /settings, /post.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser, SignOutButton } from '@clerk/nextjs';
import {
  BadgeHelp,
  Bookmark,
  CircleDollarSign,
  Gift,
  House,
  KeyRound,
  LogOut,
  Search,
  ShieldCheck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { fetchCreditBalance } from '@/lib/api/credits';
import { formatKes } from '@/lib/format';
import { cn } from '@/lib/utils';

const navigationGroups = [
  {
    label: 'Explore',
    items: [
      { title: 'Listings', href: '/listings', icon: House },
      { title: 'Search', href: '/search', icon: Search },
      { title: 'Pricing', href: '/pricing', icon: CircleDollarSign },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Saved', href: '/saved', icon: Bookmark },
      { title: 'Wallet', href: '/wallet', icon: Wallet },
      { title: 'Unlocks', href: '/unlocks', icon: KeyRound },
      { title: 'Referrals', href: '/referrals', icon: Gift },
      { title: 'Profile', href: '/profile', icon: UserCircle2 },
    ],
  },
  {
    label: 'Company',
    items: [
      { title: 'About', href: '/about', icon: ShieldCheck },
      { title: 'Support', href: '/support', icon: BadgeHelp },
    ],
  },
] as const;

function isActivePath(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function TenantWorkspaceShell({
  pathname,
  title,
  description,
  children,
  actions,
}: {
  pathname: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchCreditBalance(getToken)
      .then((b) => setBalance(b.balance))
      .catch(() => null);
  }, [getToken]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '—';
  const displaySub = user?.primaryEmailAddress?.emailAddress ?? user?.primaryPhoneNumber?.phoneNumber ?? '';

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-4 px-3 py-4">
          <Link href="/" className="flex items-center px-2 py-2">
            <BrandLogo priority className="group-data-[collapsible=icon]:hidden" />
            <span className="hidden size-9 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
              <ShieldCheck className="size-4" />
            </span>
          </Link>

          <div className="border border-sidebar-border bg-sidebar-accent p-4 shadow-sm group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Available balance
            </p>
            <p className="mt-2 text-2xl font-semibold text-sidebar-foreground">
              {balance !== null ? formatKes(balance) : '—'}
            </p>
            <p className="mt-1 text-sm text-sidebar-foreground/65">
              Ready for browsing and unlocks.
            </p>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={active}
                          render={<Link href={item.href} />}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="px-3 pb-4">
          <div className="border border-sidebar-border bg-sidebar-accent p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-medium text-sidebar-foreground">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{displaySub}</p>
              </div>
              <SignOutButton>
                <button
                  type="button"
                  aria-label="Sign out"
                  className="ml-auto group-data-[collapsible=icon]:hidden"
                >
                  <LogOut className="size-4 text-sidebar-foreground/50 transition hover:text-sidebar-foreground" />
                </button>
              </SignOutButton>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <SidebarTrigger className="mt-0.5 shrink-0" />
              <div>
                <h1 className="text-[1.9rem] font-semibold text-foreground">
                  {title}
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
          </div>
        </header>

        <div className={cn('px-4 py-6 sm:px-6 lg:px-8')}>
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

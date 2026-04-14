"use client";

import Link from 'next/link';
import {
  BadgeHelp,
  Bookmark,
  CircleDollarSign,
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
import { mockCreditBalance, mockCurrentUser } from '@/lib/mock-app-state';
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
  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-4 px-3 py-4">
          <Link
            href="/"
            className="flex items-center rounded-2xl px-2 py-2"
          >
            <BrandLogo priority className="group-data-[collapsible=icon]:hidden" />
            <span className="hidden size-9 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
              <ShieldCheck className="size-4" />
            </span>
          </Link>

          <div className="rounded-2xl border border-sidebar-border bg-[#f8fafc] p-4 shadow-soft-sm group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Available balance
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-sidebar-foreground">
              {formatKes(mockCreditBalance.balance)}
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
          <div className="rounded-2xl border border-sidebar-border bg-[#f8fafc] p-3 shadow-soft-sm">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>
                  {mockCurrentUser.firstName[0]}
                  {mockCurrentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-medium text-sidebar-foreground">
                  {mockCurrentUser.firstName} {mockCurrentUser.lastName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {mockCurrentUser.phoneNumber}
                </p>
              </div>
              <LogOut className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-white">
        <header className="sticky top-0 z-30 border-b border-black/8 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <SidebarTrigger className="mt-0.5 shrink-0" />
              <div>
                <h1 className="font-display text-[1.9rem] font-semibold tracking-[-0.05em] text-[#252525]">
                  {title}
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#667085]">{description}</p>
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

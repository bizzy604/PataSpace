"use client";

import Link from 'next/link';
import {
  BadgeHelp,
  Bookmark,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  House,
  LogOut,
  ShieldCheck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
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

const navigation = [
  { title: 'Saved', href: '/saved', icon: Bookmark },
  { title: 'Wallet overview', href: '/wallet', icon: Wallet },
  { title: 'Buy credits', href: '/wallet/buy', icon: CircleDollarSign },
  { title: 'Transactions', href: '/wallet/transactions', icon: CreditCard },
  { title: 'My unlocks', href: '/unlocks', icon: House },
  { title: 'Profile', href: '/profile', icon: UserCircle2 },
  { title: 'Support', href: '/support', icon: BadgeHelp },
] as const;

function isActivePath(currentPath: string, href: string) {
  if (href === '/wallet') {
    return currentPath === href;
  }

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
            className="flex items-center gap-2 rounded-2xl border border-sidebar-border bg-white/80 px-3 py-3 shadow-soft-sm"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="font-display text-base font-semibold tracking-[-0.04em] text-sidebar-foreground">
                PataSpace
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Tenant workspace
              </p>
            </div>
          </Link>

          <div className="rounded-[24px] border border-sidebar-border bg-white/80 p-4 shadow-soft-sm group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/60">
              Wallet balance
            </p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-sidebar-foreground">
              {formatKes(mockCreditBalance.balance)}
            </p>
            <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
              Enough for active browsing, unlocks, and follow-through actions.
            </p>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
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
                        {active ? <ChevronRight className="ml-auto size-4" /> : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-3 pb-4">
          <div className="rounded-[24px] border border-sidebar-border bg-white/80 p-3 shadow-soft-sm">
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

      <SidebarInset className="bg-[#f7f4ee]">
        <header className="sticky top-0 z-30 border-b border-black/6 bg-[rgba(247,244,238,0.86)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <SidebarTrigger className="mt-1" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
                  Tenant workspace
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#62686a]">
                  {description}
                </p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>

        <div className={cn('px-4 py-6 sm:px-6 lg:px-8')}>
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

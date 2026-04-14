import Link from 'next/link';
import { Show, SignInButton, SignOutButton, SignUpButton, UserButton } from '@clerk/nextjs';
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
  return (
    <div className={cn('min-h-screen bg-white text-[#252525]', className)}>
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16">
          <Link href="/" aria-label="PataSpace home" className="inline-flex shrink-0 items-center">
            <BrandLogo priority />
          </Link>

          <div className="flex items-center gap-2.5">
            <Show when="signed-in">
              <Link href="/wallet" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                <LayoutDashboard className="size-4" />
                Workspace
              </Link>
            </Show>
            <Show when="signed-out">
              <SignUpButton mode="redirect">
                <button type="button" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  <UserPlus className="size-4" />
                  Register
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button type="button" className={linkButtonClass({ size: 'sm' })}>
                  <LogIn className="size-4" />
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className="rounded-full border border-black/8 bg-white p-1 shadow-soft-sm">
                <UserButton />
              </div>
            </Show>
            <Show when="signed-in">
              <SignOutButton>
                <button type="button" className={linkButtonClass({ variant: 'outline', size: 'sm' })}>
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </SignOutButton>
            </Show>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="relative">{children}</div>
      </div>

      <footer className="border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <BrandLogo compact />
            <p className="text-sm text-[#62686a]">
              Tenant-first housing discovery for Nairobi.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#62686a]">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-[#252525]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

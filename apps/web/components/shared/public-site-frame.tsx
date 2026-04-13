import Link from 'next/link';
import { Show, SignInButton, SignOutButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { LogIn, LogOut, Phone, UserPlus, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { linkButtonClass } from '@/lib/link-button';

const primaryLinks = [
  { label: 'Browse listings', href: '/listings' },
  { label: 'Post listing', href: '/post' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'My unlocks', href: '/unlocks' },
  { label: 'Support', href: '/support' },
] as const;

const footerColumns = [
  {
    title: 'Discovery',
    links: [
      { label: 'Browse listings', href: '/listings' },
      { label: 'Post listing', href: '/post' },
      { label: 'Photo gallery', href: '/listings/listing-1/gallery' },
      { label: 'How unlocks work', href: '/listings/listing-1/unlock' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Register', href: '/auth/register' },
      { label: 'Sign in', href: '/auth/sign-in' },
    ],
  },
  {
    title: 'Tenant workspace',
    links: [
      { label: 'Wallet overview', href: '/wallet' },
      { label: 'Transactions', href: '/wallet/transactions' },
      { label: 'My unlocks', href: '/unlocks' },
      { label: 'Profile', href: '/profile' },
    ],
  },
] as const;

export function PublicSiteFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-h-screen bg-[#f7f4ee] text-[#252525]', className)}>
      <header className="sticky top-0 z-40 border-b border-black/6 bg-[rgba(247,244,238,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.04em]">
            <span className="size-2 rounded-full bg-[#28809A]" />
            PataSpace
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#4b4f50] transition hover:text-[#252525]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:+254700123123"
              className="hidden items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-[#4b4f50] shadow-soft-sm lg:inline-flex"
            >
              <Phone className="size-4 text-[#28809A]" />
              +254 700 123 123
            </a>
            <Link
              href="/wallet"
              className={linkButtonClass({ variant: 'outline', size: 'sm' })}
            >
              <Wallet className="size-4" />
              Wallet
            </Link>
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(40,128,154,0.12),transparent_62%)]" />
        <div className="relative">{children}</div>
      </div>

      <footer className="border-t border-black/8 bg-[#1d1f20] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.04em]">
              <span className="size-2 rounded-full bg-[#28809A]" />
              PataSpace
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/64">
              Tenant-first housing discovery for Nairobi, with credits, unlocks,
              dispute protection, and direct contact once a listing is worth pursuing.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/34">
                {column.title}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-white/62 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

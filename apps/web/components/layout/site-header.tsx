import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { linkButtonVariants } from '@/lib/link-button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-separator bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#252525] text-sm font-semibold uppercase tracking-[0.22em] text-white">
              PS
            </span>
            <div>
              <strong className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                PataSpace
              </strong>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-secondary">
                Web Interface
              </p>
            </div>
          </Link>
          <Badge variant="outline" className="hidden lg:inline-flex">
            20 screens scoped
          </Badge>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground-secondary">
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <Link href="/listings" className="transition hover:text-foreground">
            Listings
          </Link>
          <Link href="/wallet" className="transition hover:text-foreground">
            Wallet
          </Link>
          <Link href="/unlocks" className="transition hover:text-foreground">
            Unlocks
          </Link>
          <Link href="/support" className="transition hover:text-foreground">
            Support
          </Link>
          <Link
            href="/auth/sign-in"
            className={linkButtonVariants({ variant: 'outline', size: 'sm' })}
          >
            Sign in
          </Link>
          <Link href="/profile" className={linkButtonVariants({ size: 'sm' })}>
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

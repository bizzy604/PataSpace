import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-separator bg-background/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <strong className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
            PataSpace
          </strong>
          <Badge variant="outline" className="hidden sm:inline-flex">
            MVP
          </Badge>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-foreground-secondary">
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <Link href="/listings" className="transition hover:text-foreground">
            Listings
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex h-10 items-center justify-center rounded-full border border-separator bg-card px-4 text-sm font-semibold text-foreground shadow-soft-sm transition hover:bg-surface-elevated"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

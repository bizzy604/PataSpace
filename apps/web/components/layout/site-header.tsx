import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-300/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <strong className="text-lg font-black tracking-tight text-stone-950">PataSpace</strong>
          <Badge variant="outline" className="hidden sm:inline-flex">
            MVP
          </Badge>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-700">
          <Link href="/">Home</Link>
          <Link href="/listings">Listings</Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

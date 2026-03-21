import { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-separator px-6 py-8 lg:border-r lg:border-b-0">
        <div className="glass-panel-strong rounded-[32px] p-6">
          <p className="section-kicker text-primary">Operations</p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
            PataSpace Admin
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground-secondary">
            Listings, disputes, payouts, and marketplace oversight.
          </p>
        </div>

        <nav className="mt-8 grid gap-3 text-sm">
          <a
            className="rounded-[22px] border border-separator-strong bg-card px-4 py-3 font-semibold text-foreground shadow-soft-sm"
            href="#dashboard"
          >
            Dashboard
          </a>
          <a
            className="rounded-[22px] px-4 py-3 text-foreground-secondary transition hover:bg-fill-soft hover:text-foreground"
            href="#reviews"
          >
            Listing Reviews
          </a>
          <a
            className="rounded-[22px] px-4 py-3 text-foreground-secondary transition hover:bg-fill-soft hover:text-foreground"
            href="#disputes"
          >
            Disputes
          </a>
          <a
            className="rounded-[22px] px-4 py-3 text-foreground-secondary transition hover:bg-fill-soft hover:text-foreground"
            href="#payouts"
          >
            Payouts
          </a>
        </nav>
      </aside>

      <main className="px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

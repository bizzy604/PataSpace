import { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-stone-800 bg-stone-950 px-6 py-8 text-stone-100 lg:border-r lg:border-b-0">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400">
            Operations
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight">PataSpace Admin</h1>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            Listings, disputes, payouts, and marketplace oversight.
          </p>
        </div>

        <nav className="mt-8 grid gap-3 text-sm">
          <a
            className="rounded-2xl border border-stone-800 bg-stone-900/70 px-4 py-3 font-medium text-stone-100"
            href="#dashboard"
          >
            Dashboard
          </a>
          <a className="rounded-2xl px-4 py-3 text-stone-400 transition hover:bg-stone-900/60 hover:text-stone-100" href="#reviews">
            Listing Reviews
          </a>
          <a className="rounded-2xl px-4 py-3 text-stone-400 transition hover:bg-stone-900/60 hover:text-stone-100" href="#disputes">
            Disputes
          </a>
          <a className="rounded-2xl px-4 py-3 text-stone-400 transition hover:bg-stone-900/60 hover:text-stone-100" href="#payouts">
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

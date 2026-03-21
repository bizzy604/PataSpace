export function DashboardPage() {
  return (
    <section className="space-y-8" id="dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Marketplace control
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-950">
            Operations dashboard
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-stone-600">
          Review pending listings, resolve disputes, and monitor commission payouts from a single control surface.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article
          id="payouts"
          className="rounded-3xl border border-stone-300/80 bg-white/85 p-6 shadow-sm backdrop-blur"
        >
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
            Pending reviews
          </p>
          <p className="mt-4 text-4xl font-black text-stone-950">12</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Newly submitted listings waiting for moderation and GPS/media checks.
          </p>
        </article>

        <article className="rounded-3xl border border-stone-300/80 bg-white/85 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
            Open disputes
          </p>
          <p className="mt-4 text-4xl font-black text-stone-950">4</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Active dispute cases needing evidence review and refund decisions.
          </p>
        </article>

        <article className="rounded-3xl border border-stone-300/80 bg-white/85 p-6 shadow-sm backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
            Due payouts
          </p>
          <p className="mt-4 text-4xl font-black text-stone-950">9</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Confirmed commissions approaching or ready for M-Pesa payout processing.
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section
          id="reviews"
          className="rounded-[28px] border border-stone-300/80 bg-white/80 p-6 shadow-sm backdrop-blur"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-stone-950">Moderation queue</h3>
              <p className="mt-2 text-sm text-stone-600">
                First-time listings should surface here with tenant, rent, media, and GPS checks.
              </p>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-900">
              next
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-stone-100 px-4 py-4 text-sm text-stone-700">
              Kilimani, 2BR, submitted 3 hours ago, media verification pending.
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-4 text-sm text-stone-700">
              South B bedsitter, repeat tenant, ready for fast-track review.
            </div>
            <div className="rounded-2xl bg-stone-100 px-4 py-4 text-sm text-stone-700">
              Westlands studio, address mismatch flagged for manual inspection.
            </div>
          </div>
        </section>

        <section
          id="disputes"
          className="rounded-[28px] border border-stone-300/80 bg-stone-950 p-6 text-stone-100 shadow-sm"
        >
          <h3 className="text-xl font-bold">Dispute watchlist</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Keep urgent cases visible to reduce refund delays and commission conflicts.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-4">
              <p className="text-sm font-semibold text-stone-100">Fake photos allegation</p>
              <p className="mt-1 text-sm text-stone-400">Evidence submitted, admin review needed.</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-4">
              <p className="text-sm font-semibold text-stone-100">Post-confirmation rejection</p>
              <p className="mt-1 text-sm text-stone-400">Potential refund path should be evaluated.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

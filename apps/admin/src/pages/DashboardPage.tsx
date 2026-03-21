export function DashboardPage() {
  return (
    <section className="space-y-8" id="dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Marketplace control</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">
            Operations dashboard
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-foreground-secondary">
          Review pending listings, resolve disputes, and monitor commission payouts from a single control surface.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article id="payouts" className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground-tertiary">
            Pending reviews
          </p>
          <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">12</p>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Newly submitted listings waiting for moderation and GPS/media checks.
          </p>
        </article>

        <article className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground-tertiary">
            Open disputes
          </p>
          <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">4</p>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Active dispute cases needing evidence review and refund decisions.
          </p>
        </article>

        <article className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground-tertiary">
            Due payouts
          </p>
          <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-foreground">9</p>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Confirmed commissions approaching or ready for M-Pesa payout processing.
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section id="reviews" className="glass-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Moderation queue</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                First-time listings should surface here with tenant, rent, media, and GPS checks.
              </p>
            </div>
            <span className="rounded-full bg-fill-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              next
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
              Kilimani, 2BR, submitted 3 hours ago, media verification pending.
            </div>
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
              South B bedsitter, repeat tenant, ready for fast-track review.
            </div>
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4 text-sm text-foreground-secondary">
              Westlands studio, address mismatch flagged for manual inspection.
            </div>
          </div>
        </section>

        <section id="disputes" className="glass-panel-strong rounded-[28px] p-6">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Dispute watchlist</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Keep urgent cases visible to reduce refund delays and commission conflicts.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Fake photos allegation</p>
              <p className="mt-1 text-sm text-foreground-secondary">Evidence submitted, admin review needed.</p>
            </div>
            <div className="rounded-[22px] border border-separator bg-fill-soft px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Post-confirmation rejection</p>
              <p className="mt-1 text-sm text-foreground-secondary">
                Potential refund path should be evaluated.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

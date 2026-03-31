type KeyStatProps = {
  label: string;
  value: string;
};

export function KeyStat({ label, value }: KeyStatProps) {
  return (
    <div className="rounded-[28px] border border-separator bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,241,234,0.94))] px-5 py-5 shadow-[var(--page-shadow)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-foreground-secondary">
        {label}
      </p>
      <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
        {value}
      </p>
    </div>
  );
}

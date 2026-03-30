type KeyStatProps = {
  label: string;
  value: string;
};

export function KeyStat({ label, value }: KeyStatProps) {
  return (
    <div className="rounded-[24px] border border-separator bg-surface-elevated px-4 py-4 shadow-soft-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-secondary">
        {label}
      </p>
      <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>
    </div>
  );
}

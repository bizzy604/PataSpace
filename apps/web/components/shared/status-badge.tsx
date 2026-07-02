/**
 * Purpose: Generic status chip with a small tone palette.
 * Why important: One consistent way to render lifecycle states (listing
 *   status, dispute status, ban state) across the admin console.
 * Used by: /admin pages (listings, users, disputes).
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger';

const toneClassName: Record<StatusTone, string> = {
  neutral: 'border-border/60 bg-muted text-muted-foreground',
  brand: 'border-primary/20 bg-primary/10 text-primary',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  danger: 'border-destructive/20 bg-destructive/5 text-destructive',
};

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: StatusTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]', toneClassName[tone], className)}
    >
      {label}
    </Badge>
  );
}

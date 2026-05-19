import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MockUnlockStatus, MockTransaction } from '@/lib/mock-app-state';

type StatusTone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger';

const toneClassName: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  brand: 'border-primary/30 bg-primary/10 text-primary',
  positive: 'border-green-300 bg-green-50 text-green-800',
  warning: 'border-accent bg-accent/20 text-accent-foreground',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
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

export function unlockStatusMeta(status: MockUnlockStatus) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', tone: 'positive' as const };
    case 'pending_confirmation':
      return { label: 'Pending confirmation', tone: 'warning' as const };
    case 'disputed':
      return { label: 'Disputed', tone: 'danger' as const };
    case 'refunded':
      return { label: 'Refunded', tone: 'brand' as const };
    default:
      return { label: status, tone: 'neutral' as const };
  }
}

export function transactionStatusMeta(status: MockTransaction['status']) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', tone: 'positive' as const };
    case 'PENDING':
      return { label: 'Pending', tone: 'warning' as const };
    case 'FAILED':
      return { label: 'Failed', tone: 'danger' as const };
    case 'REFUNDED':
      return { label: 'Refunded', tone: 'brand' as const };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'neutral' as const };
    default:
      return { label: status, tone: 'neutral' as const };
  }
}

export function transactionTypeMeta(type: MockTransaction['type']) {
  switch (type) {
    case 'PURCHASE':
      return { label: 'Purchase', tone: 'brand' as const };
    case 'SPEND':
      return { label: 'Unlock spend', tone: 'warning' as const };
    case 'REFUND':
      return { label: 'Refund', tone: 'positive' as const };
    case 'BONUS':
      return { label: 'Bonus', tone: 'neutral' as const };
    default:
      return { label: type, tone: 'neutral' as const };
  }
}

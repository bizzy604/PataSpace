import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MockUnlockStatus, MockTransaction } from '@/lib/mock-app-state';

type StatusTone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger';

const toneClassName: Record<StatusTone, string> = {
  neutral: 'border-black/10 bg-black/4 text-[#4b4f50]',
  brand: 'border-[#28809A]/20 bg-[#28809A]/10 text-[#21687d]',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
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
      className={cn('rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]', toneClassName[tone], className)}
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

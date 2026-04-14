import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MetricCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint: string;
  Icon?: LucideIcon;
}) {
  return (
    <Card size="sm" className="h-fit border border-black/8 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7b8081]">
            {label}
          </p>
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#f4f7fa] text-[#28809A]">
              <Icon className="size-[0.95rem]" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-3">
        <CardTitle className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-[#252525]">
          {value}
        </CardTitle>
        <p className="text-sm leading-5 text-[#667085]">{hint}</p>
      </CardContent>
    </Card>
  );
}

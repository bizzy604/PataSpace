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
    <Card className="border border-black/8 bg-white shadow-[0_20px_60px_rgba(37,37,37,0.06)]">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8081]">
            {label}
          </p>
          {Icon ? (
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#28809A]/10 text-[#28809A]">
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-5">
        <CardTitle className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525]">
          {value}
        </CardTitle>
        <p className="text-sm leading-6 text-[#62686a]">{hint}</p>
      </CardContent>
    </Card>
  );
}

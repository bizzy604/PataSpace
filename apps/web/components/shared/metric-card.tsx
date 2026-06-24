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
    <Card size="sm" className="h-fit border border-border bg-card shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-[0.95rem]" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-3">
        <CardTitle className="text-[1.65rem] font-semibold text-foreground">
          {value}
        </CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  badge?: string;
  kicker?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function PageIntro({
  badge,
  kicker,
  title,
  description,
  actions,
  className,
}: PageIntroProps) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl">
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        {kicker ? <p className="section-kicker mt-4">{kicker}</p> : null}
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-secondary sm:text-lg">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

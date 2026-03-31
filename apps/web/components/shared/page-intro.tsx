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
    <div className={cn("page-aurora flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
          {kicker ? <p className="section-kicker">{kicker}</p> : null}
        </div>
        <h1 className="headline-glow mt-5 font-display text-4xl font-semibold tracking-[-0.07em] text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-foreground-secondary sm:text-[1.05rem] sm:leading-8">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div> : null}
    </div>
  );
}

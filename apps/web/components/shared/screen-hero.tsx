import { cn } from '@/lib/utils';

export function ScreenHero({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-4 pb-6 pt-8 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="inline-flex items-center border border-border bg-muted px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              {description}
            </p>
          </div>

          {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

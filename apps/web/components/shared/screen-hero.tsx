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
        <div className="flex flex-col gap-5 border-b border-black/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="inline-flex items-center rounded-full border border-black/8 bg-[#f8fafc] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#28809A]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.06em] text-[#252525] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085] sm:text-[0.95rem]">
              {description}
            </p>
          </div>

          {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

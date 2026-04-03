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
    <section className={cn('px-4 pb-6 pt-10 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-black/8 bg-white/92 px-6 py-8 shadow-[0_24px_80px_rgba(37,37,37,0.08)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#28809A]">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#62686a] sm:text-base">
                {description}
              </p>
            </div>

            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

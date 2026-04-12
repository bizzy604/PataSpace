import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StitchPreviewShell({
  title,
  description,
  children,
  backHref = '/stitch/pataspace-login',
  backLabel = 'All Stitch screens',
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="page-aurora min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,209,227,0.18),transparent_30%),linear-gradient(180deg,#f8f6ef_0%,#f1ede4_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/88 px-4 py-2 text-sm font-medium text-[#252525] shadow-soft-sm backdrop-blur-xl transition hover:border-[#28809A]/20 hover:text-[#28809A]"
        >
          <ChevronLeft className="size-4" />
          {backLabel}
        </Link>

        <div className="mt-6 flex flex-col gap-4 rounded-[32px] border border-black/8 bg-white/86 p-6 shadow-[0_24px_80px_rgba(37,37,37,0.08)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker border-[#28809A]/12 bg-[#28809A]/8 text-[#21687d]">
              Stitch Import Preview
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.07em] text-[#252525]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#62686a]">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export function StitchActionLink({
  href,
  children,
  variant = 'light',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
        variant === 'dark'
          ? 'bg-[#252525] text-white hover:bg-[#1a1a1a]'
          : 'border border-black/8 bg-white text-[#252525] hover:border-[#28809A]/20 hover:text-[#28809A]',
      )}
    >
      {children}
      <ExternalLink className="size-4" />
    </Link>
  );
}

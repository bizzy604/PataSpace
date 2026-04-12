import Link from 'next/link';
import type { StitchScreenRecord } from '@/lib/stitch/pataspace-login';

export function StitchScreenGrid({ screens }: { screens: StitchScreenRecord[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {screens.map((screen) => (
        <article
          key={screen.slug}
          className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]"
        >
          <div className="border-b border-black/6 bg-[#f7f4ee] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#28809A]">
              Screen {String(screen.order).padStart(2, '0')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">
              {screen.title}
            </h2>
          </div>

          <Link href={`/stitch/pataspace-login/${screen.slug}`} className="block">
            <img
              src={`/stitch/pataspace-login/assets/${screen.slug}`}
              alt={`${screen.title} Stitch screenshot`}
              className="aspect-[5/4] w-full object-cover object-top"
            />
          </Link>

          <div className="space-y-4 px-4 py-4 text-sm leading-7 text-[#62686a]">
            <p>
              {screen.deviceType} export at {screen.width} x {screen.height}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/stitch/pataspace-login/${screen.slug}`}
                className="inline-flex items-center rounded-full bg-[#252525] px-4 py-2 font-medium text-white transition hover:bg-[#1a1a1a]"
              >
                Open preview
              </Link>
              <Link
                href={`/stitch/pataspace-login/source/${screen.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-black/8 px-4 py-2 font-medium text-[#252525] transition hover:border-[#28809A]/20 hover:text-[#28809A]"
              >
                Open raw HTML
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

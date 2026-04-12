import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Code2, ImageIcon } from 'lucide-react';
import { StitchEmbeddedScreen } from '@/components/stitch/pataspace-login/embedded-screen';
import { StitchPreviewShell, StitchActionLink } from '@/components/stitch/pataspace-login/preview-shell';
import {
  getPataSpaceLoginScreens,
  getPataSpaceLoginScreen,
  readPataSpaceLoginHtml,
} from '@/lib/stitch/pataspace-login';

export const dynamicParams = false;

export function generateStaticParams() {
  return getPataSpaceLoginScreens().map((screen) => ({
    screen: screen.slug,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen: slug } = await params;
  const screens = getPataSpaceLoginScreens();
  const screen = getPataSpaceLoginScreen(slug);
  const html = readPataSpaceLoginHtml(slug);

  if (!screen || !html) {
    notFound();
  }

  const currentIndex = screens.findIndex((item) => item.slug === slug);
  const previous = currentIndex > 0 ? screens[currentIndex - 1] : null;
  const next = currentIndex < screens.length - 1 ? screens[currentIndex + 1] : null;

  return (
    <StitchPreviewShell
      title={screen.title}
      description={`Preview route for Stitch screen ${String(screen.order).padStart(2, '0')} of ${screens.length}. The embedded frame renders the committed raw HTML export, while the action links expose the bundled source artifacts.`}
      actions={
        <>
          <StitchActionLink href={`/stitch/pataspace-login/source/${screen.slug}`}>
            <Code2 className="size-4" />
            Local HTML source
          </StitchActionLink>
          <StitchActionLink href={`/stitch/pataspace-login/assets/${screen.slug}`} variant="dark">
            <ImageIcon className="size-4" />
            Local PNG
          </StitchActionLink>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Screen id', value: screen.id },
          { label: 'Resource', value: screen.name },
          { label: 'Dimensions', value: `${screen.width} x ${screen.height}` },
          { label: 'Device type', value: screen.deviceType },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-black/8 bg-white/86 p-5 shadow-soft-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">
              {item.label}
            </p>
            <p className="mt-3 break-all text-sm leading-7 text-[#252525]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <StitchEmbeddedScreen html={html} title={screen.title} height={screen.height} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-black/8 bg-white/86 p-4 shadow-soft-sm">
        <div className="flex flex-wrap gap-3">
          {previous ? (
            <Link href={`/stitch/pataspace-login/${previous.slug}`} className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#252525] transition hover:border-[#28809A]/20 hover:text-[#28809A]">
              Previous: {previous.title}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/stitch/pataspace-login/${next.slug}`} className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-[#252525] transition hover:border-[#28809A]/20 hover:text-[#28809A]">
              Next: {next.title}
            </Link>
          ) : null}
        </div>
        <Link href="/stitch/pataspace-login" className="rounded-full bg-[#252525] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a1a]">
          Back to index
        </Link>
      </div>
    </StitchPreviewShell>
  );
}

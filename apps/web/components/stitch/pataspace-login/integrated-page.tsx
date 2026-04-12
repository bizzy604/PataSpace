import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSiteFrame } from '@/components/shared/public-site-frame';
import { ScreenHero } from '@/components/shared/screen-hero';
import { StitchLiveScreen } from '@/components/stitch/pataspace-login/live-screen';
import {
  getPataSpaceLoginManifest,
  pataspaceLoginManifestPath,
} from '@/lib/stitch/pataspace-login';
import { linkButtonClass } from '@/lib/link-button';

export function StitchIntegratedPage({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const manifest = getPataSpaceLoginManifest();

  if (!manifest) {
    return (
      <PublicSiteFrame>
        <ScreenHero
          eyebrow="Stitch export unavailable"
          title="This route is wired for Stitch, but the local export is missing"
          description={`The "${slug}" route is configured to render a committed Stitch HTML export. The web app stays bootable, but this screen will remain in fallback mode until the manifest is restored.`}
          actions={
            <>
              <Link href="/listings" className={linkButtonClass({ size: 'sm' })}>
                Browse listings
              </Link>
              <Link
                href="/how-it-works"
                className={linkButtonClass({ variant: 'outline', size: 'sm' })}
              >
                How it works
              </Link>
            </>
          }
        />

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#28809A]">
              Expected manifest
            </p>
            <p className="mt-4 break-all rounded-[24px] bg-[#f7f4ee] px-4 py-3 font-mono text-sm text-[#252525]">
              {pataspaceLoginManifestPath}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62686a]">
              Restore the `Docs/Stitch/PataSpace-Login` export bundle to bring this route back to the
              committed Stitch HTML preview. Native web routes such as listings and the explainer pages
              are still available.
            </p>
          </div>
        </section>
      </PublicSiteFrame>
    );
  }

  const screen = manifest.screens.find((item) => item.slug === slug) ?? null;

  if (!screen) {
    notFound();
  }

  return <StitchLiveScreen slug={screen.slug} title={screen.title} height={screen.height} className={className} />;
}

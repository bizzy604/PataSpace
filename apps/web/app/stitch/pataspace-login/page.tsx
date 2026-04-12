import { Code2, ImageIcon } from 'lucide-react';
import { StitchPreviewShell, StitchActionLink } from '@/components/stitch/pataspace-login/preview-shell';
import { StitchScreenGrid } from '@/components/stitch/pataspace-login/screen-grid';
import {
  getPataSpaceLoginManifest,
  pataspaceLoginManifestPath,
} from '@/lib/stitch/pataspace-login';

export default function Page() {
  const manifest = getPataSpaceLoginManifest();

  if (!manifest) {
    return (
      <StitchPreviewShell
        title="PataSpace Login export unavailable"
        description="The Stitch preview index expects a committed manifest plus bundled HTML and PNG assets. They are not present in this checkout, so preview routes are currently disabled."
        backHref="/"
        backLabel="Back to web app"
      >
        <div className="rounded-[28px] border border-black/8 bg-white/86 p-6 shadow-soft-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">
            Expected manifest
          </p>
          <p className="mt-3 break-all rounded-[24px] bg-[#f7f4ee] px-4 py-3 font-mono text-sm text-[#252525]">
            {pataspaceLoginManifestPath}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62686a]">
            Add the `Docs/Stitch/PataSpace-Login` export bundle to enable the preview index, the raw
            HTML source routes, and the PNG asset routes.
          </p>
        </div>
      </StitchPreviewShell>
    );
  }

  return (
    <StitchPreviewShell
      title={manifest.project.title}
      description="Supporting preview routes for the committed PataSpace Login Stitch exports. The main app now mounts selected screens directly into its existing routes, and this index remains available for raw HTML and screenshot inspection."
      backHref="/"
      backLabel="Back to web app"
      actions={
        <>
          <StitchActionLink href="/stitch/pataspace-login/source/edit-profile">
            <Code2 className="size-4" />
            Raw HTML
          </StitchActionLink>
          <StitchActionLink href="/stitch/pataspace-login/assets/edit-profile" variant="dark">
            <ImageIcon className="size-4" />
            PNG asset
          </StitchActionLink>
        </>
      }
    >
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Project id', value: manifest.project.id },
          { label: 'Device type', value: manifest.project.deviceType },
          { label: 'Project type', value: manifest.project.projectType },
          { label: 'Screens exported', value: `${manifest.screens.length}` },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] border border-black/8 bg-white/86 p-5 shadow-soft-sm backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#28809A]">
              {item.label}
            </p>
            <p className="mt-3 break-all font-medium text-[#252525]">{item.value}</p>
          </div>
        ))}
      </div>

      <StitchScreenGrid screens={manifest.screens} />
    </StitchPreviewShell>
  );
}

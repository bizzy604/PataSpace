import { cn } from "@/lib/utils";
import { MediaTone } from "@/lib/mock-listings";

const toneClasses: Record<MediaTone, string> = {
  lagoon: "from-[#0f2931] via-[#20596a] to-[#71afc0]",
  midnight: "from-[#121212] via-[#252525] to-[#5a7382]",
  sunrise: "from-[#3c1d14] via-[#93563e] to-[#e3a56c]",
  sand: "from-[#44321d] via-[#9d7d50] to-[#dbc59f]",
  forest: "from-[#15241c] via-[#305444] to-[#6fa184]",
  graphite: "from-[#1d2228] via-[#43505d] to-[#9aa6b3]",
};

type MediaTileProps = {
  title: string;
  caption: string;
  tone: MediaTone;
  gpsTag?: string;
  className?: string;
};

export function MediaTile({ title, caption, tone, gpsTag, className }: MediaTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/8 bg-[#252525] shadow-[var(--page-shadow-strong)]",
        className,
      )}
    >
      <div className={cn("min-h-[220px] bg-gradient-to-br p-5", toneClasses[tone])}>
        <div className="texture-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-white/16 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-4 right-4 h-24 w-24 rounded-full bg-[#67d1e3]/18 blur-3xl" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between rounded-[28px] border border-white/18 bg-[#252525]/28 p-5 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
              Media
            </span>
            {gpsTag ? (
              <span className="rounded-full bg-[#67d1e3]/18 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                {gpsTag}
              </span>
            ) : null}
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-white">
              {title}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/74">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

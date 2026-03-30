import { cn } from "@/lib/utils";
import { MediaTone } from "@/lib/mock-listings";

const toneClasses: Record<MediaTone, string> = {
  lagoon: "from-[#2d8ca0] via-[#67b9c9] to-[#dff4f6]",
  midnight: "from-[#252525] via-[#3f5362] to-[#ced7de]",
  sunrise: "from-[#f29a5c] via-[#f9c47f] to-[#fff1d6]",
  sand: "from-[#d0b48b] via-[#efe0c0] to-[#fffaf2]",
  forest: "from-[#2b5a46] via-[#69a081] to-[#ddeee5]",
  graphite: "from-[#4d5660] via-[#7f8b97] to-[#ebeff3]",
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
        "relative overflow-hidden rounded-[28px] border border-separator bg-card",
        className,
      )}
    >
      <div className={cn("min-h-[220px] bg-gradient-to-br p-5", toneClasses[tone])}>
        <div className="flex h-full flex-col justify-between rounded-[24px] border border-white/35 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-[#252525]/85 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
              Media
            </span>
            {gpsTag ? (
              <span className="rounded-full bg-white/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#252525]">
                {gpsTag}
              </span>
            ) : null}
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#252525]">
              {title}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#252525]/74">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

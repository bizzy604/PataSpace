export function StitchEmbeddedScreen({
  html,
  title,
  height,
}: {
  html: string;
  title: string;
  height: number;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
      <iframe
        title={title}
        srcDoc={html}
        className="block w-full border-0 bg-white"
        style={{ height: `${Math.max(880, Math.round(height / 2))}px` }}
      />
    </div>
  );
}

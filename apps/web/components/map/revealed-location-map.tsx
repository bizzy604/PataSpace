function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number) {
  const latOffset = 0.005;
  const lngOffset = 0.005;
  const params = new URLSearchParams({
    bbox: [
      longitude - lngOffset,
      latitude - latOffset,
      longitude + lngOffset,
      latitude + latOffset,
    ].join(','),
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function RevealedLocationMap({
  address,
  latitude,
  longitude,
  title,
}: {
  address: string;
  latitude: number;
  longitude: number;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(37,37,37,0.08)]">
      <div className="border-b border-black/8 px-5 py-4">
        <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[#252525]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#62686a]">{address}</p>
      </div>
      <iframe
        title={`${title} revealed location`}
        src={buildOpenStreetMapEmbedUrl(latitude, longitude)}
        className="block h-[320px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="border-t border-black/8 px-5 py-4 text-sm leading-7 text-[#62686a]">
        Exact coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

export function StitchLiveScreen({
  slug,
  title,
  height,
  className,
}: {
  slug: string;
  title: string;
  height: number;
  className?: string;
}) {
  return (
    <iframe
      title={title}
      src={`/stitch/pataspace-login/source/${slug}`}
      className={cn('block w-full border-0 bg-white', className)}
      style={{ height: `${Math.max(960, Math.round(height / 2))}px` }}
    />
  );
}

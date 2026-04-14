import Image from 'next/image';
import { cn } from '@/lib/utils';

export function BrandLogo({
  compact = false,
  className,
  priority = false,
}: {
  compact?: boolean;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/pataspace-logo.png"
      alt="PataSpace"
      width={compact ? 112 : 144}
      height={compact ? 32 : 40}
      priority={priority}
      className={cn(
        'w-auto object-contain brightness-95 contrast-125',
        compact ? 'h-8 md:h-9' : 'h-9 md:h-10',
        className,
      )}
    />
  );
}

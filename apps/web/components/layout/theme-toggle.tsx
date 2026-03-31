'use client';

import { startTransition, useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const themeOptions = [
  { value: 'light', label: 'Light', Icon: SunMedium },
  { value: 'dark', label: 'Dark', Icon: MoonStar },
] as const;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-separator bg-card/88 p-1 shadow-soft-sm backdrop-blur-xl">
      {themeOptions.map(({ value, label, Icon }) => {
        const active = mounted && resolvedTheme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => startTransition(() => setTheme(value))}
            aria-pressed={active}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-9 rounded-full px-3',
              active
                ? 'bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary'
                : 'text-foreground-secondary hover:bg-fill-soft hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden lg:inline">{label}</span>
            <span className="sr-only">{label} mode</span>
          </button>
        );
      })}
    </div>
  );
}

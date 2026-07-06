/**
 * Purpose: Floating action button — teal circle with a white icon, for the
 *   high-frequency "Add listing" action (DESIGN.md FAB spec).
 * Why important: A single elevated affordance the browse/home surfaces pin to
 *   the bottom-right; keeps size, colour, and shadow uniform.
 * Used by: home/browse (Phase 2).
 */
import type { ComponentProps } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';

type FabProps = PressableProps & {
  icon: ComponentProps<typeof AppIcon>['name'];
  className?: string;
};

export function Fab({ icon, className, ...props }: FabProps) {
  return (
    <Pressable
      className={cn(
        'h-14 w-14 items-center justify-center rounded-full bg-primary shadow-floating active:opacity-90',
        className,
      )}
      {...props}
    >
      <AppIcon name={icon} inverse size={26} />
    </Pressable>
  );
}

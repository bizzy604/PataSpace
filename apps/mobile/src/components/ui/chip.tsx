/**
 * Purpose: Full-pill filter chip (browse/search/filters). Inactive = muted
 *   fill, active = teal fill with white label, per DESIGN.md's chip spec.
 * Why important: The primary filtering affordance across the discover flow;
 *   one component keeps every chip identical.
 * Used by: filters, search, and browse screens (Phase 2).
 */
import type { ComponentProps } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';
import { chipVariants, chipTextVariants } from '@/components/ui/variants/chip-variants';

type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  active?: boolean;
  icon?: ComponentProps<typeof AppIcon>['name'];
  className?: string;
  textClassName?: string;
};

export function Chip({ label, active = false, icon, className, textClassName, ...props }: ChipProps) {
  return (
    <Pressable className={cn(chipVariants({ active }), className)} {...props}>
      {icon ? (
        <AppIcon name={icon} inverse={active} size={15} />
      ) : null}
      <Text className={cn(chipTextVariants({ active }), icon ? 'ml-1.5' : '', textClassName)}>
        {label}
      </Text>
    </Pressable>
  );
}

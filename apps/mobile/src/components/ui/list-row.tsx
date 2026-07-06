/**
 * Purpose: Settings/profile list row — optional leading icon, title with an
 *   optional subtitle, an optional trailing value or custom node, and a
 *   chevron when the row navigates.
 * Why important: Profile and settings are long stacks of near-identical rows;
 *   one component keeps padding, touch target (min 44px), and typography
 *   uniform.
 * Used by: profile, settings, help-center (Phases 5-6).
 */
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';

type ListRowProps = Omit<PressableProps, 'children'> & {
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof AppIcon>['name'];
  value?: string;
  /** Custom trailing node (e.g. a Switch); overrides value + chevron. */
  trailing?: ReactNode;
  /** Show a chevron to signal navigation. Ignored when trailing is set. */
  chevron?: boolean;
  destructive?: boolean;
  className?: string;
};

export function ListRow({
  title,
  subtitle,
  icon,
  value,
  trailing,
  chevron = false,
  destructive = false,
  className,
  ...props
}: ListRowProps) {
  return (
    <Pressable
      className={cn(
        'min-h-[52px] flex-row items-center gap-3 rounded-[12px] bg-surface-elevated px-4 py-3 active:opacity-90',
        className,
      )}
      {...props}
    >
      {icon ? (
        <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
          <AppIcon name={icon} active size={18} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text
          className={cn(
            'font-body-medium text-body-lg',
            destructive ? 'text-danger' : 'text-foreground',
          )}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 font-body text-label-md text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {trailing ? (
        trailing
      ) : (
        <View className="flex-row items-center gap-2">
          {value ? (
            <Text className="font-body text-body-md text-muted-foreground">{value}</Text>
          ) : null}
          {chevron ? <AppIcon name="chevron-forward" size={18} /> : null}
        </View>
      )}
    </Pressable>
  );
}

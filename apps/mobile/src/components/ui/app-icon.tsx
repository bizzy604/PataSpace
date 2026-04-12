import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

type AppIconProps = {
  name: ComponentProps<typeof Ionicons>['name'];
  size?: number;
  active?: boolean;
  inverse?: boolean;
  color?: string;
};

export function AppIcon({
  name,
  size = 20,
  active = false,
  inverse = false,
  color: colorOverride,
}: AppIconProps) {
  const { theme } = useMobileApp();
  const color =
    colorOverride ??
    (inverse ? theme.primaryForeground : active ? theme.primary : theme.mutedForeground);

  return <Ionicons color={color} name={name} size={size} />;
}

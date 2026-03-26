import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { appleHIGTokens } from '@pataspace/design-tokens';

type AppIconProps = {
  name: ComponentProps<typeof Ionicons>['name'];
  size?: number;
  active?: boolean;
  inverse?: boolean;
};

export function AppIcon({ name, size = 20, active = false, inverse = false }: AppIconProps) {
  const color = inverse
    ? appleHIGTokens.color.text.inverse
    : active
      ? appleHIGTokens.color.accent.primary
      : appleHIGTokens.color.text.secondary;

  return <Ionicons color={color} name={name} size={size} />;
}

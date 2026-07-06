import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import {
  badgeVariants,
  badgeTextVariants,
  type BadgeVariantProps,
} from '@/components/ui/variants/badge-variants';

export function Badge({
  children,
  variant,
  className,
  textClassName,
}: {
  children: ReactNode;
  className?: string;
  textClassName?: string;
} & BadgeVariantProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{children}</Text>
    </View>
  );
}

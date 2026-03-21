import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva('rounded-full px-3 py-1.5', {
  variants: {
    variant: {
      default: 'bg-primary shadow-card',
      secondary: 'bg-secondary',
      outline: 'border border-border bg-card',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('text-xs font-bold uppercase tracking-[2px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Badge({
  children,
  variant,
}: {
  children: ReactNode;
} & VariantProps<typeof badgeVariants>) {
  return (
    <View className={badgeVariants({ variant })}>
      <Text className={badgeTextVariants({ variant })}>{children}</Text>
    </View>
  );
}

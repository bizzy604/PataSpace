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
      dark: 'bg-surface-inverse',
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
      dark: 'text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Badge({
  children,
  variant,
  className,
  textClassName,
}: {
  children: ReactNode;
  className?: string;
  textClassName?: string;
} & VariantProps<typeof badgeVariants>) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{children}</Text>
    </View>
  );
}

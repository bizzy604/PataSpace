import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva('rounded-full px-3 py-1.5', {
  variants: {
    variant: {
      default: 'bg-amber-400',
      secondary: 'bg-stone-800',
      outline: 'border border-stone-700 bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('text-xs font-bold uppercase tracking-[2px]', {
  variants: {
    variant: {
      default: 'text-stone-950',
      secondary: 'text-stone-100',
      outline: 'text-stone-300',
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

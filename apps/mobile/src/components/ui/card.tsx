import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-[28px] border border-stone-800 bg-stone-900/90 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Text className={cn('text-2xl font-black tracking-tight text-stone-50', className)}>{children}</Text>;
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Text className={cn('mt-3 text-base leading-7 text-stone-300', className)}>{children}</Text>;
}

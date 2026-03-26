import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-[24px] border border-border bg-card p-5 shadow-card', className)}
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
  return (
    <Text
      className={cn(
        'text-[24px] font-semibold tracking-[-0.6px] text-foreground',
        className,
      )}
    >
      {children}
    </Text>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text className={cn('mt-2 text-[15px] leading-6 text-muted-foreground', className)}>
      {children}
    </Text>
  );
}

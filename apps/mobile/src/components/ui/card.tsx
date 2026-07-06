import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-[16px] border border-border bg-card p-4 shadow-card', className)}
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
      className={cn('font-display text-headline-md tracking-[-0.4px] text-foreground', className)}
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
    <Text className={cn('mt-2 font-body text-body-md text-muted-foreground', className)}>
      {children}
    </Text>
  );
}

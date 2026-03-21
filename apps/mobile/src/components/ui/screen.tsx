import { ScrollView, type ScrollViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Screen({ className, contentContainerStyle, ...props }: ScrollViewProps & { className?: string }) {
  return (
    <ScrollView
      className={cn('flex-1 bg-stone-950', className)}
      contentContainerStyle={[{ padding: 24, gap: 16 }, contentContainerStyle]}
      {...props}
    />
  );
}

import { ScrollView, type ScrollViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Screen({ className, contentContainerStyle, ...props }: ScrollViewProps & { className?: string }) {
  return (
    <ScrollView
      className={cn('flex-1 bg-background', className)}
      contentContainerStyle={[{ padding: 24, gap: 18 }, contentContainerStyle]}
      {...props}
    />
  );
}

/**
 * Purpose: Segmented step indicator for the multi-step post-a-listing flow
 *   (camera -> review -> details -> submit).
 * Why important: Gives the 4-step flow a single, consistent progress header so
 *   each step screen shows the same bar and "Step X of N" counter.
 * Used by: create-listing flow screens (Phase 4).
 */
import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

type ProgressStepsProps = {
  /** Total number of steps. */
  count: number;
  /** Zero-based index of the active step. */
  current: number;
  label?: string;
  className?: string;
};

export function ProgressSteps({ count, current, label, className }: ProgressStepsProps) {
  return (
    <View className={cn('gap-2', className)}>
      <View className="flex-row gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <View
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              index <= current ? 'bg-primary' : 'bg-surface-subtle',
            )}
          />
        ))}
      </View>
      <Text className="font-body-medium text-label-md text-muted-foreground">
        {label ? `${label} · ` : ''}Step {Math.min(current + 1, count)} of {count}
      </Text>
    </View>
  );
}

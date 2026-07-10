import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import { MotionView } from '@/components/ui/motion-view';

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ kicker, title, description, className }: SectionHeaderProps) {
  return (
    <MotionView className={cn('gap-1.5', className)} distance={10}>
      {kicker ? (
        <Text className="font-body-bold text-label-md uppercase tracking-[1px] text-muted-foreground">
          {kicker}
        </Text>
      ) : null}
      <Text className="font-display text-display-02 text-foreground">{title}</Text>
      {description ? (
        <Text className="font-body text-body-md text-muted-foreground" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </MotionView>
  );
}

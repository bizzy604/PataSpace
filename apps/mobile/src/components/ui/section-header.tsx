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
        <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-muted-foreground">
          {kicker}
        </Text>
      ) : null}
      <Text className="text-[32px] font-semibold tracking-[-1px] text-foreground">{title}</Text>
      {description ? (
        <Text className="text-[14px] leading-5 text-muted-foreground" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </MotionView>
  );
}

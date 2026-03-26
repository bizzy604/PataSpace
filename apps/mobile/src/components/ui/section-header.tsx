import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ kicker, title, description, className }: SectionHeaderProps) {
  return (
    <View className={cn('gap-2', className)}>
      {kicker ? (
        <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-muted-foreground">
          {kicker}
        </Text>
      ) : null}
      <Text className="text-[32px] font-semibold tracking-[-1px] text-foreground">{title}</Text>
      {description ? (
        <Text className="text-[15px] leading-6 text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}

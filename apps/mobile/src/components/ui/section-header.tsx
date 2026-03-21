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
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-amber-400">{kicker}</Text>
      ) : null}
      <Text className="text-3xl font-black tracking-tight text-stone-50">{title}</Text>
      {description ? <Text className="text-base leading-7 text-stone-300">{description}</Text> : null}
    </View>
  );
}

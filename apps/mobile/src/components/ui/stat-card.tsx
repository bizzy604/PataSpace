import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="flex-1 p-5">
      <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">{label}</Text>
      <Text className="mt-2 text-[28px] font-semibold tracking-[-0.6px] text-foreground">
        {value}
      </Text>
    </Card>
  );
}

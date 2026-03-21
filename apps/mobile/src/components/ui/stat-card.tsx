import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="flex-1 p-5">
      <Text className="text-sm uppercase tracking-[2px] text-stone-400">{label}</Text>
      <Text className="mt-3 text-3xl font-black text-stone-50">{value}</Text>
    </Card>
  );
}

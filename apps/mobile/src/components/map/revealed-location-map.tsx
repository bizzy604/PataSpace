import { Text } from 'react-native';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

type RevealedLocationMapProps = {
  address: string;
  latitude: number;
  longitude: number;
  title: string;
};

export function RevealedLocationMap({
  address,
  latitude,
  longitude,
  title,
}: RevealedLocationMapProps) {
  return (
    <Card>
      <CardTitle className="text-[20px]">{title}</CardTitle>
      <CardDescription>{address}</CardDescription>
      <Text className="mt-3 text-sm text-muted-foreground">
        Exact coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
    </Card>
  );
}

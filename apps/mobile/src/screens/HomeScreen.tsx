import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

export function HomeScreen() {
  return (
    <Screen contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
      <Card className="rounded-[36px] bg-surface-elevated">
        <Badge variant="secondary">Mobile app</Badge>
        <CardTitle className="mt-4 text-[38px]">PataSpace</CardTitle>
        <CardDescription>
          Listing capture, GPS verification, uploads, unlocks, and confirmations all
          share the same Apple-inspired token system as web and admin.
        </CardDescription>

        <View className="mt-8 gap-3">
          <Link href="/browse" asChild>
            <Button variant="outline" label="Browse listings" />
          </Link>
          <Link href="/create-listing" asChild>
            <Button label="Create listing" />
          </Link>
          <Link href="/my-listings" asChild>
            <Button variant="secondary" label="My listings" />
          </Link>
          <Link href="/confirmations" asChild>
            <Button variant="outline" label="Confirmation flow" />
          </Link>
        </View>
      </Card>

      <View className="mt-2 flex-row flex-wrap gap-3">
        <Badge variant="outline">Expo Router ready</Badge>
        <Badge variant="secondary">Shared semantic tokens</Badge>
      </View>

      <Text className="text-center text-sm text-muted-foreground">
        Core mobile primitives now match the web and admin visual system.
      </Text>
    </Screen>
  );
}

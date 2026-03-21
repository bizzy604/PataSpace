import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

export function CreateListingScreen() {
  return (
    <Screen>
      <Badge>Outgoing tenant flow</Badge>
      <Card>
        <CardTitle>Create listing</CardTitle>
        <CardDescription>
          Camera capture, GPS verification, photo ordering, video upload, and the listing form live here next.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-stone-400">
            Step 1
          </Text>
          <Text className="mt-2 text-lg font-bold text-stone-50">Capture property media</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-stone-400">
            Step 2
          </Text>
          <Text className="mt-2 text-lg font-bold text-stone-50">Confirm GPS and address</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-stone-400">
            Step 3
          </Text>
          <Text className="mt-2 text-lg font-bold text-stone-50">Publish for review or go live</Text>
        </Card>
      </View>

      <Link href="/" asChild>
        <Button variant="outline" label="Back home" />
      </Link>
    </Screen>
  );
}

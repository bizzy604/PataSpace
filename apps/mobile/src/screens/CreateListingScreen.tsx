import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function CreateListingScreen() {
  return (
    <Screen>
      <SectionHeader
        kicker="Outgoing tenant flow"
        title="Create listing"
        description="Capture the space once, verify it with location data, then send it into review with a clean handoff."
      />

      <Badge variant="secondary">Capture and verify</Badge>

      <Card>
        <CardTitle>What happens here</CardTitle>
        <CardDescription>
          Camera capture, GPS verification, photo ordering, video upload, and the listing form live here next.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-tertiary-foreground">
            Step 1
          </Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Capture property media</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-tertiary-foreground">
            Step 2
          </Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Confirm GPS and address</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-tertiary-foreground">
            Step 3
          </Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Publish for review or go live</Text>
        </Card>
      </View>

      <Link href="/" asChild>
        <Button variant="outline" label="Back home" />
      </Link>
    </Screen>
  );
}

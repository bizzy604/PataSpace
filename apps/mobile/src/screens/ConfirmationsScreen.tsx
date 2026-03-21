import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function ConfirmationsScreen() {
  return (
    <Screen>
      <SectionHeader
        kicker="Confirmation flow"
        title="Confirm the connection"
        description="Both sides confirm after contact is made, and that unlock then moves toward commission payout."
      />

      <View className="flex-row flex-wrap gap-3">
        <Badge>Incoming confirmed</Badge>
        <Badge variant="secondary">Outgoing pending</Badge>
      </View>

      <Card>
        <CardTitle>Current unlock status</CardTitle>
        <CardDescription>
          Once both sides confirm, the commission enters a waiting period before payout processing begins.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Step 1</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Incoming tenant confirms</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Step 2</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Outgoing tenant confirms</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Step 3</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">
            Commission becomes payable after the hold period
          </Text>
        </Card>
      </View>

      <Link href="/my-listings" asChild>
        <Button variant="secondary" label="View listing dashboard" />
      </Link>
    </Screen>
  );
}

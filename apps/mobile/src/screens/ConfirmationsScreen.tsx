import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { confirmationStages, featuredListings } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function ConfirmationsScreen() {
  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Confirmation flow"
        title="Confirm the connection"
        description="Both sides confirm after contact is made, and that unlock then moves toward commission payout."
      />

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/70">
          Current unlock
        </Text>
        <Text className="mt-2 text-[26px] font-semibold tracking-[-0.6px] text-white">
          Waiting on outgoing tenant confirmation.
        </Text>
        <Text className="mt-2 text-sm leading-6 text-white/70">
          Once both parties confirm, commission moves into hold before payout processing starts.
        </Text>
        <View className="mt-4 h-2 rounded-full bg-white/15">
          <View className="h-2 w-1/2 rounded-full bg-primary" />
        </View>
      </View>

      <Card>
        <View className="flex-row flex-wrap gap-3">
          <Badge>Incoming confirmed</Badge>
          <Badge variant="secondary">Outgoing pending</Badge>
        </View>
        <CardTitle className="mt-4">Current unlock status</CardTitle>
        <CardDescription>
          The latest unlocked listing is {featuredListings[0].title}. One side is done, one side still needs to acknowledge the connection.
        </CardDescription>
      </Card>

      <View className="gap-3">
        {confirmationStages.map((stage) => (
          <Card key={stage.step} className="p-5">
            <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">
              Step {stage.step}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">{stage.title}</Text>
            <CardDescription className="mt-2">{stage.detail}</CardDescription>
          </Card>
        ))}
      </View>

      <Link href="/my-listings" asChild>
        <Button variant="secondary" label="View listing dashboard" />
      </Link>
    </Screen>
  );
}

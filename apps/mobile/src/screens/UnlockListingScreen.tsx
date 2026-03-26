import { Link } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { getListingById } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function UnlockListingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const listing = getListingById(params.id);

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Button label={`Unlock for ${listing.unlockCost}`} />
          <Link href="/confirmations" asChild>
            <Button variant="outline" label="See confirmation flow" />
          </Link>
        </View>
      }
    >
      <SectionHeader
        kicker="Unlock flow"
        title="Review unlock"
        description="Show the tenant exactly what will be spent, what gets revealed, and how the follow-up confirmation works."
      />

      <Card>
        <Badge variant="secondary">{listing.area}</Badge>
        <CardTitle className="mt-4 text-[22px]">{listing.title}</CardTitle>
        <CardDescription>
          Unlocking reveals phone number, exact address, and GPS pin so both parties can connect directly without back-and-forth.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Credits required</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">
            {listing.unlockCost}
          </Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Current balance</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">5,000</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Balance after unlock</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">2,500</Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-xl">What you reveal</CardTitle>
        <CardDescription>
          Tenant phone number, building directions, GPS marker, and move-out timing become available immediately after payment.
        </CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-xl">Protection built in</CardTitle>
        <CardDescription>
          The outgoing tenant is notified, both sides confirm the contact later, and commission only moves forward after the hold window.
        </CardDescription>
      </Card>
    </Screen>
  );
}

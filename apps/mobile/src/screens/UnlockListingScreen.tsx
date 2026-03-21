import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function UnlockListingScreen() {
  return (
    <Screen>
      <SectionHeader
        kicker="Unlock flow"
        title="Unlock contact details"
        description="Show the tenant exactly what credits are being spent and what gets revealed."
      />

      <Card>
        <Badge variant="secondary">Kilimani 2BR</Badge>
        <CardTitle className="mt-4">Sunny 2BR handover near Yaya Centre</CardTitle>
        <CardDescription>
          Unlocking reveals phone number, exact address, and GPS pin so both parties can connect directly.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Credits required</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">2,500</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Current balance</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">5,000</Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-xl">After unlock</CardTitle>
        <CardDescription>
          The outgoing tenant is notified, both parties chat offline, then later confirm the connection in-app.
        </CardDescription>
      </Card>

      <Link href="/confirmations" asChild>
        <Button label="Continue to confirmation flow" />
      </Link>
    </Screen>
  );
}

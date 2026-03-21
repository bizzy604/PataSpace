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
          <Text className="text-sm uppercase tracking-[2px] text-stone-400">Credits required</Text>
          <Text className="mt-2 text-2xl font-black text-stone-50">2,500</Text>
        </Card>
        <Card className="p-5">
          <Text className="text-sm uppercase tracking-[2px] text-stone-400">Current balance</Text>
          <Text className="mt-2 text-2xl font-black text-stone-50">5,000</Text>
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

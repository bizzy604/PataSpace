import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { SectionHeader } from '@/components/ui/section-header';

export function MyListingsScreen() {
  return (
    <Screen>
      <SectionHeader
        kicker="Outgoing dashboard"
        title="My listings"
        description="Track listing status, views, unlock counts, confirmations, and upcoming payouts."
      />
      <Card>
        <Badge variant="secondary">Tenant dashboard</Badge>
        <CardTitle className="mt-4">Operational snapshot</CardTitle>
        <CardDescription>Keep a quick view of which listings are live and which ones still need review.</CardDescription>
      </Card>

      <View className="flex-row gap-3">
        <StatCard label="Active" value="3" />
        <StatCard label="Pending" value="1" />
      </View>

      <Link href="/" asChild>
        <Button variant="outline" label="Back home" />
      </Link>
    </Screen>
  );
}

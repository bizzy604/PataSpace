import { Link } from 'expo-router';
import { View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

const listings = [
  {
    id: 'kilimani-2br',
    title: 'Sunny 2BR handover near Yaya Centre',
    rent: 'KES 25,000',
    unlock: '2,500 credits',
  },
  {
    id: 'southb-studio',
    title: 'Affordable studio close to CBD routes',
    rent: 'KES 14,500',
    unlock: '1,450 credits',
  },
];

export function BrowseListingsScreen() {
  return (
    <Screen>
      <SectionHeader
        kicker="Incoming tenant flow"
        title="Browse listings"
        description="Free browsing, fast filters, then unlock only the listing you want."
      />

      <View className="gap-3">
        <Input placeholder="Search neighborhood" />
        <View className="flex-row gap-3">
          <Input className="flex-1" placeholder="Min rent" keyboardType="numeric" />
          <Input className="flex-1" placeholder="Max rent" keyboardType="numeric" />
        </View>
      </View>

      {listings.map((listing) => (
        <Card key={listing.id}>
          <View className="flex-row flex-wrap gap-2">
            <Badge variant="outline">Verified</Badge>
            <Badge variant="secondary">{listing.unlock}</Badge>
          </View>
          <CardTitle className="mt-4 text-2xl">{listing.title}</CardTitle>
          <CardDescription>
            {listing.rent}. Photos, video, and GPS verification available.
          </CardDescription>
          <Link href="/unlock" asChild>
            <Button className="mt-6" label="Unlock this listing" />
          </Link>
        </Card>
      ))}
    </Screen>
  );
}

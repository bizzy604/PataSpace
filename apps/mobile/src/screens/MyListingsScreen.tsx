import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { myListingRows } from '@/data/mock-listings';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { SectionHeader } from '@/components/ui/section-header';
import { listingHref } from '@/lib/routes';

export function MyListingsScreen() {
  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Outgoing dashboard"
        title="My listings"
        description="Track listing status, views, unlock counts, confirmations, and anything waiting for payout."
      />

      <View className="flex-row items-center justify-between rounded-[28px] bg-secondary p-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
            Quick action
          </Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Post a new listing</Text>
        </View>
        <Link href="/create-listing" asChild>
          <IconButton label="NEW" />
        </Link>
      </View>

      <View className="flex-row gap-3">
        <StatCard label="Active" value="3" />
        <StatCard label="Pending" value="1" />
        <StatCard label="Unlocks" value="7" />
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Badge variant="dark">Live</Badge>
        <Badge variant="secondary">Review</Badge>
        <Badge variant="secondary">Closed</Badge>
      </View>

      {myListingRows.map((listing) => (
        <Card key={listing.id} className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Badge variant={listing.status === 'Live' ? 'dark' : 'secondary'}>
                {listing.status}
              </Badge>
              <CardTitle className="text-[20px]">{listing.title}</CardTitle>
              <CardDescription className="mt-0">{listing.updated}</CardDescription>
            </View>
            <Link href={listingHref(listing.id)} asChild>
              <Button size="sm" label="Open" />
            </Link>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-[18px] bg-secondary p-4">
              <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Views</Text>
              <Text className="mt-2 text-lg font-semibold text-foreground">{listing.views}</Text>
            </View>
            <View className="flex-1 rounded-[18px] bg-secondary p-4">
              <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
                Unlocks
              </Text>
              <Text className="mt-2 text-lg font-semibold text-foreground">{listing.unlocks}</Text>
            </View>
          </View>

          <View className="rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Payout status
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-foreground">{listing.payout}</Text>
          </View>
        </Card>
      ))}

      <Link href="/create-listing" asChild>
        <Button variant="outline" label="Create another listing" />
      </Link>
    </Screen>
  );
}

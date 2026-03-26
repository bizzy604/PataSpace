import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, listingHref, myListingsHref, type MyListingsFilter } from '@/lib/routes';

function SummaryCard({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={
        active
          ? 'flex-1 rounded-[24px] border border-transparent bg-primary p-5 shadow-card active:opacity-90'
          : 'flex-1 rounded-[24px] border border-border bg-card p-5 shadow-card active:opacity-90'
      }
      onPress={onPress}
    >
      <Text
        className={
          active
            ? 'text-xs uppercase tracking-[1.8px] text-primary-foreground/80'
            : 'text-xs uppercase tracking-[1.8px] text-tertiary-foreground'
        }
      >
        {label}
      </Text>
      <Text
        className={
          active
            ? 'mt-2 text-[28px] font-semibold tracking-[-0.6px] text-primary-foreground'
            : 'mt-2 text-[28px] font-semibold tracking-[-0.6px] text-foreground'
        }
      >
        {value}
      </Text>
    </Pressable>
  );
}

export function MyListingsScreen() {
  const params = useLocalSearchParams<{ filter?: MyListingsFilter | MyListingsFilter[] }>();
  const router = useRouter();
  const { myListings } = useMobileApp();

  const filterParam = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const activeFilter: MyListingsFilter | undefined =
    filterParam === 'active' || filterParam === 'pending' || filterParam === 'unlocks'
      ? filterParam
      : undefined;

  const activeCount = myListings.filter((listing) => listing.status === 'Live').length;
  const reviewCount = myListings.filter((listing) => listing.status === 'Review').length;
  const unlockTotal = myListings.reduce((total, listing) => total + Number(listing.unlocks), 0);

  const filteredListings = myListings.filter((listing) => {
    if (activeFilter === 'active') {
      return listing.status === 'Live';
    }

    if (activeFilter === 'pending') {
      return listing.status === 'Review';
    }

    if (activeFilter === 'unlocks') {
      return Number(listing.unlocks) > 0;
    }

    return true;
  });

  const filterTitle =
    activeFilter === 'active'
      ? 'Active listings'
      : activeFilter === 'pending'
        ? 'Pending review'
        : activeFilter === 'unlocks'
          ? 'Listings with unlocks'
          : 'My listings';

  const filterDescription =
    activeFilter === 'active'
      ? 'Live listings currently visible to incoming tenants.'
      : activeFilter === 'pending'
        ? 'Listings still waiting for review and publish.'
        : activeFilter === 'unlocks'
          ? 'Listings already getting buyer activity.'
          : 'Track listing status, views, unlocks, and payout progress.';

  return (
    <Screen>
      <SectionHeader kicker="Outgoing dashboard" title={filterTitle} description={filterDescription} />

      <View className="flex-row items-center justify-between rounded-[28px] bg-secondary p-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
            Quick action
          </Text>
          <Text className="mt-2 text-lg font-semibold text-foreground">Post a new listing</Text>
        </View>
        <Link href={appRoutes.createListing} asChild>
          <IconButton icon="camera-outline" />
        </Link>
      </View>

      <View className="flex-row gap-3">
        <SummaryCard
          active={activeFilter === 'active'}
          label="Active"
          value={String(activeCount)}
          onPress={() => router.replace(myListingsHref('active'))}
        />
        <SummaryCard
          active={activeFilter === 'pending'}
          label="Pending"
          value={String(reviewCount)}
          onPress={() => router.replace(myListingsHref('pending'))}
        />
        <SummaryCard
          active={activeFilter === 'unlocks'}
          label="Unlocks"
          value={String(unlockTotal)}
          onPress={() => router.replace(myListingsHref('unlocks'))}
        />
      </View>

      {activeFilter ? (
        <Button
          variant="outline"
          label="View all listings"
          onPress={() => router.replace(myListingsHref())}
        />
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        <Badge variant="dark">Live</Badge>
        <Badge variant="secondary">Review</Badge>
        <Badge variant="secondary">Closed</Badge>
      </View>

      {filteredListings.length === 0 ? (
        <Card>
          <CardTitle className="text-[20px]">Nothing here yet</CardTitle>
          <CardDescription>No listings match this view right now.</CardDescription>
        </Card>
      ) : null}

      {filteredListings.map((listing) => (
        <Card key={listing.id} className="gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Badge variant={listing.status === 'Live' ? 'dark' : 'secondary'}>{listing.status}</Badge>
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
              <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Unlocks</Text>
              <Text className="mt-2 text-lg font-semibold text-foreground">{listing.unlocks}</Text>
            </View>
          </View>

          <View className="rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Payout status</Text>
            <Text className="mt-2 text-[15px] leading-6 text-foreground">{listing.payout}</Text>
          </View>

          <View className="rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Review note</Text>
            <Text className="mt-2 text-[15px] leading-6 text-foreground">{listing.reviewNote}</Text>
          </View>
        </Card>
      ))}

      <Link href={appRoutes.createListing} asChild>
        <Button variant="outline" label="Create another listing" />
      </Link>
    </Screen>
  );
}

/**
 * Purpose: Owner dashboard — post a listing, filter by status, and track each
 *   listing's views, unlocks, payout, and review note.
 * Why important: The supply side's home base; restyled onto the redesign kit
 *   (no data or navigation changes).
 * Used by: app/my-listings.tsx.
 */
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, myListingHref, myListingsHref, type MyListingsFilter } from '@/lib/routes';

function statusBadgeVariant(status: string): 'success' | 'warning' | 'secondary' {
  if (status === 'Live') return 'success';
  if (status === 'Review') return 'warning';
  return 'secondary';
}

export function MyListingsScreen() {
  const params = useLocalSearchParams<{ filter?: MyListingsFilter | MyListingsFilter[] }>();
  const router = useRouter();
  const { getListingById, myListings, myListingsState, refreshMyListings } = useMobileApp();

  const filterParam = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const activeFilter: MyListingsFilter | undefined =
    filterParam === 'active' || filterParam === 'pending' || filterParam === 'unlocks'
      ? filterParam
      : undefined;

  const activeCount = myListings.filter((listing) => listing.status === 'Live').length;
  const reviewCount = myListings.filter((listing) => listing.status === 'Review').length;
  const unlockTotal = myListings.reduce((total, listing) => total + Number(listing.unlocks), 0);

  const filteredListings = myListings.filter((listing) => {
    if (activeFilter === 'active') return listing.status === 'Live';
    if (activeFilter === 'pending') return listing.status === 'Review';
    if (activeFilter === 'unlocks') return Number(listing.unlocks) > 0;
    return true;
  });

  const chips: { key: MyListingsFilter | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: `Active ${activeCount}` },
    { key: 'pending', label: `Pending ${reviewCount}` },
    { key: 'unlocks', label: `Unlocks ${unlockTotal}` },
  ];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={myListingsState.isRefreshing}
          onRefresh={() => void refreshMyListings()}
        />
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">My Listings</Text>
        <Link href={appRoutes.createListing} asChild>
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80"
            accessibilityLabel="Post a new listing"
          >
            <AppIcon name="add" size={24} inverse />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            active={(activeFilter ?? 'all') === chip.key}
            onPress={() =>
              router.replace(chip.key === 'all' ? myListingsHref() : myListingsHref(chip.key))
            }
          />
        ))}
      </View>

      {myListings.length === 0 && myListingsState.status === 'loading' ? (
        <View className="items-center gap-3 rounded-[16px] bg-surface-subtle py-12">
          <AppIcon name="reload-outline" size={28} />
          <Text className="font-body text-body-md text-muted-foreground">
            Loading your listings…
          </Text>
        </View>
      ) : null}

      {myListings.length === 0 && myListingsState.status === 'error' ? (
        <View className="items-center gap-3 rounded-[16px] border border-border bg-surface-subtle px-6 py-12">
          <AppIcon name="cloud-offline-outline" size={28} />
          <Text className="text-center font-body text-body-md text-muted-foreground">
            {myListingsState.error ?? 'We could not load your listings.'}
          </Text>
          <Button size="sm" label="Try again" onPress={() => void refreshMyListings()} />
        </View>
      ) : null}

      {myListings.length > 0 && myListingsState.error ? (
        <View className="gap-3 rounded-[16px] border border-border bg-surface-subtle p-4">
          <Text className="font-body text-body-md text-muted-foreground">
            {myListingsState.error}
          </Text>
          <Button size="sm" variant="outline" label="Retry" onPress={() => void refreshMyListings()} />
        </View>
      ) : null}

      {filteredListings.length === 0 && myListingsState.status === 'ready' ? (
        <View className="items-center gap-3 rounded-[16px] bg-surface-subtle py-12">
          <AppIcon name="home-outline" size={28} />
          <Text className="font-body text-body-md text-muted-foreground">
            No listings in this view yet.
          </Text>
          <Link href={appRoutes.createListing} asChild>
            <Button size="sm" label="Post a listing" />
          </Link>
        </View>
      ) : null}

      {filteredListings.map((listing) => {
        const preview = getListingById(listing.id);

        return (
          <Link key={listing.id} href={myListingHref(listing.id)} asChild>
            <Pressable className="overflow-hidden rounded-[16px] bg-card shadow-card active:opacity-95">
              {preview ? (
                <View className="relative">
                  <Image
                    className="h-40 w-full bg-surface-subtle"
                    resizeMode="cover"
                    source={preview.coverImage}
                  />
                  <View className="absolute left-3 top-3">
                    <Badge variant={statusBadgeVariant(listing.status)}>{listing.status}</Badge>
                  </View>
                  <View className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1">
                    <Text className="font-body-medium text-caption text-white">{preview.photoCount}</Text>
                  </View>
                </View>
              ) : null}

              <View className="gap-3 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-display text-headline-sm text-foreground">{listing.title}</Text>
                    <Text className="mt-0.5 font-body text-label-md text-muted-foreground">
                      {listing.updated}
                    </Text>
                  </View>
                  {!preview ? (
                    <Badge variant={statusBadgeVariant(listing.status)}>{listing.status}</Badge>
                  ) : null}
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1 rounded-[12px] bg-surface-subtle p-3">
                    <Text className="font-body text-label-md text-muted-foreground">Views</Text>
                    <Text className="font-display text-body-lg text-foreground">{listing.views}</Text>
                  </View>
                  <View className="flex-1 gap-1 rounded-[12px] bg-surface-subtle p-3">
                    <Text className="font-body text-label-md text-muted-foreground">Unlocks</Text>
                    <Text className="font-display text-body-lg text-foreground">{listing.unlocks}</Text>
                  </View>
                </View>

                <View className="gap-1 rounded-[12px] bg-surface-subtle p-3">
                  <Text className="font-body text-label-md text-muted-foreground">Payout status</Text>
                  <Text className="font-body text-body-md text-foreground">{listing.payout}</Text>
                </View>

                {listing.reviewNote ? (
                  <View className="flex-row items-center gap-1.5">
                    <AppIcon name="information-circle-outline" size={15} />
                    <Text className="flex-1 font-body text-label-md text-muted-foreground">
                      {listing.reviewNote}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </Link>
        );
      })}
    </Screen>
  );
}

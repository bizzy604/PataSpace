/**
 * Purpose: Home browse feed ("Find Your Home") — title + filter entry, a search
 *   bar, the teal balance card, quick filter chips, and the listing feed.
 *   Matches Main Flow 1-5/home_browse_listings.
 * Why important: The signed-in landing screen and the main discovery surface.
 * Used by: app/index.tsx when authenticated.
 */
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ListingCard } from '@/components/ui/listing-card';
import { MotionView } from '@/components/ui/motion-view';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, contactRevealedHref, listingHref } from '@/lib/routes';

export function HomeScreen() {
  const [selectedFilter, setSelectedFilter] = useState('For you');
  const {
    walletBalance,
    listingFilters,
    browseListings,
    feedState,
    isListingUnlocked,
    refreshListings,
  } = useMobileApp();

  const filteredListings = browseListings.filter((listing) => {
    if (selectedFilter === 'Verified') return listing.status === 'Verified';
    if (selectedFilter === 'Budget') return listing.monthlyRent <= 18000;
    if (selectedFilter === '2 BR') {
      return listing.meta.toLowerCase().includes('2 bed') || listing.title.toLowerCase().includes('2br');
    }
    return true;
  });

  return (
    <Screen
      withTabBar
      refreshControl={
        <RefreshControl
          refreshing={feedState.isRefreshing}
          onRefresh={() => void refreshListings()}
        />
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">Find Your Home</Text>
        <Link href={appRoutes.filters} asChild>
          <Pressable className="h-11 w-11 items-center justify-center active:opacity-70">
            <AppIcon name="options-outline" size={24} active />
          </Pressable>
        </Link>
      </View>

      <Link href={appRoutes.search} asChild>
        <Pressable className="min-h-12 flex-row items-center gap-3 rounded-[12px] bg-surface-subtle px-4">
          <AppIcon name="search-outline" size={20} />
          <Text className="font-body text-body-lg text-muted-foreground">Search by neighborhood…</Text>
        </Pressable>
      </Link>

      <MotionView
        className="flex-row items-center justify-between rounded-[16px] bg-primary p-5"
        distance={14}
      >
        <View className="gap-1">
          <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-white/70">
            Balance
          </Text>
          <Text className="font-display text-headline-md text-white">
            {walletBalance.toLocaleString()} KES
          </Text>
        </View>
        <Link href={appRoutes.buyCredits} asChild>
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
            accessibilityLabel="Add credits"
          >
            <AppIcon name="add" size={22} color="#00667E" />
          </Pressable>
        </Link>
      </MotionView>

      <View className="flex-row flex-wrap gap-2">
        {listingFilters.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            active={selectedFilter === filter}
            onPress={() => setSelectedFilter(filter)}
          />
        ))}
      </View>

      {browseListings.length === 0 && feedState.status === 'loading' ? (
        <Card>
          <CardTitle>Loading homes</CardTitle>
          <CardDescription>Fetching the latest verified listings for you.</CardDescription>
        </Card>
      ) : null}

      {browseListings.length === 0 && feedState.status === 'error' ? (
        <Card>
          <CardTitle>Could not load homes</CardTitle>
          <CardDescription>{feedState.error ?? 'Check your connection and try again.'}</CardDescription>
          <Button className="mt-2" label="Try again" onPress={() => void refreshListings()} />
        </Card>
      ) : null}

      {browseListings.length === 0 && feedState.status === 'ready' ? (
        <Card>
          <CardTitle>No homes available yet</CardTitle>
          <CardDescription>New verified listings will appear here as soon as they are published.</CardDescription>
        </Card>
      ) : null}

      {browseListings.length > 0 && feedState.error ? (
        <Card>
          <CardTitle>Could not refresh homes</CardTitle>
          <CardDescription>{feedState.error}</CardDescription>
          <Button className="mt-2" variant="outline" label="Retry" onPress={() => void refreshListings()} />
        </Card>
      ) : null}

      {browseListings.length > 0 && filteredListings.length === 0 ? (
        <Card>
          <CardTitle>No homes match this filter</CardTitle>
          <CardDescription>Choose another filter or pull down to refresh the latest listings.</CardDescription>
        </Card>
      ) : null}

      {filteredListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
          actionLabel={isListingUnlocked(listing.id) ? 'Open Contact' : 'View Details'}
        />
      ))}
    </Screen>
  );
}

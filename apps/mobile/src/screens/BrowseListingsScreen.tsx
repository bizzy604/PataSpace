/**
 * Purpose: Browse-all feed — searchable, filterable list of every browse
 *   listing. Secondary discovery surface behind the home feed.
 * Why important: The "see everything" list; shares the filter logic and card
 *   with home/search so results stay consistent.
 * Used by: app/browse.tsx.
 */
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { filterBrowseListings } from '@/screens/ExploreScreens';
import { appRoutes, contactRevealedHref, listingHref } from '@/lib/routes';

export function BrowseListingsScreen() {
  const [query, setQuery] = useState('');
  const { browseListings, searchFilters, isListingUnlocked } = useMobileApp();
  const filteredListings = filterBrowseListings(browseListings, query, searchFilters);

  return (
    <Screen withTabBar>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">Browse</Text>
        <Link href={appRoutes.map} asChild>
          <Pressable className="h-11 w-11 items-center justify-center active:opacity-70">
            <AppIcon name="map-outline" size={22} active />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row items-center gap-3">
        <Input className="flex-1" value={query} onChangeText={setQuery} placeholder="Search area" />
        <Link href={appRoutes.filters} asChild>
          <Pressable className="h-12 w-12 items-center justify-center rounded-[12px] bg-surface-subtle active:opacity-80">
            <AppIcon name="options-outline" size={22} active />
          </Pressable>
        </Link>
      </View>

      <Text className="font-body-medium text-label-md text-muted-foreground">
        {filteredListings.length} {filteredListings.length === 1 ? 'home' : 'homes'} available
      </Text>

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

import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { filterBrowseListings } from '@/screens/ExploreScreens';
import { appRoutes, contactRevealedHref, listingHref } from '@/lib/routes';

export function BrowseListingsScreen() {
  const [query, setQuery] = useState('');
  const { browseListings, searchFilters, isListingUnlocked } = useMobileApp();
  const filteredListings = filterBrowseListings(browseListings, query, searchFilters);

  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Browse and discover"
        title="Browse"
      />

      <View className="flex-row items-center gap-3">
        <Input
          className="flex-1"
          value={query}
          onChangeText={setQuery}
          placeholder="Search area"
        />
        <Link href={appRoutes.filters} asChild>
          <IconButton icon="options-outline" />
        </Link>
      </View>

      <View className="flex-row gap-3">
        <Link href={appRoutes.search} asChild>
          <Button className="flex-1" variant="outline" label="Search" />
        </Link>
        <Link href={appRoutes.map} asChild>
          <Button className="flex-1" variant="outline" label="Map" />
        </Link>
      </View>

      <View className="flex-row">
        <View className="rounded-full bg-secondary px-4 py-2">
          <Text className="text-sm font-semibold text-foreground">{filteredListings.length} shown</Text>
        </View>
      </View>

      {filteredListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
          actionLabel={isListingUnlocked(listing.id) ? 'Open contact' : 'View details'}
        />
      ))}
    </Screen>
  );
}

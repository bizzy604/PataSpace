import { Text, View } from 'react-native';
import { featuredListings, listingFilters } from '@/data/mock-listings';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { listingHref } from '@/lib/routes';

export function BrowseListingsScreen() {
  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Incoming tenant flow"
        title="Browse homes"
        description="Filter down quickly, compare verified listings, then unlock only what is worth the spend."
      />

      <View className="flex-row items-center gap-3">
        <Input className="flex-1" placeholder="Search neighborhood, road, or budget" />
        <IconButton label="FX" />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {listingFilters.map((filter, index) => (
          <View
            key={filter}
            className={index === 1 ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'}
          >
            <Text
              className={
                index === 1
                  ? 'text-sm font-semibold text-primary-foreground'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {filter}
            </Text>
          </View>
        ))}
      </View>

      {featuredListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={listingHref(listing.id)}
          actionLabel="View details"
        />
      ))}
    </Screen>
  );
}

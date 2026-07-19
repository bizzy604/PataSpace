import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import {
  type ListingPreview,
  type NotificationRecord,
  type SearchFilters,
} from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ListingsMap } from '@/components/map/listings-map';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  filterNotifications,
  groupNotificationsByDay,
  notificationCategory,
  notificationFilters,
  type NotificationCategory,
  type NotificationFilter,
} from '@/lib/notifications/notification-view';
import {
  appRoutes,
  contactRevealedHref,
  listingHref,
} from '@/lib/routes';

function matchesBudget(listing: ListingPreview, budget: SearchFilters['selectedBudget']) {
  if (budget === 'Any') {
    return true;
  }

  if (budget === 'Budget') {
    return listing.monthlyRent <= 18000;
  }

  if (budget === 'Mid') {
    return listing.monthlyRent > 18000 && listing.monthlyRent <= 30000;
  }

  return listing.monthlyRent > 30000;
}

function matchesSize(listing: ListingPreview, size: SearchFilters['selectedSize']) {
  if (size === 'Any') {
    return true;
  }

  if (size === 'Studio') {
    return listing.meta.toLowerCase().includes('studio');
  }

  if (size === '1 BR') {
    return listing.meta.toLowerCase().includes('1 bed');
  }

  return listing.meta.toLowerCase().includes('2 bed') || listing.title.toLowerCase().includes('2br');
}

export function filterBrowseListings(
  listings: ListingPreview[],
  query: string,
  searchFilters: SearchFilters,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return listings.filter((listing) => {
    const matchesQuery =
      !normalizedQuery ||
      listing.title.toLowerCase().includes(normalizedQuery) ||
      listing.location.toLowerCase().includes(normalizedQuery) ||
      listing.area.toLowerCase().includes(normalizedQuery);
    const verifiedMatch = !searchFilters.verifiedOnly || listing.status === 'Verified';
    const fastMoveMatch =
      !searchFilters.fastMove ||
      listing.tags.includes('Fast move') ||
      listing.availableFrom.toLowerCase().includes('march');
    const areaMatch = !searchFilters.selectedArea || listing.area === searchFilters.selectedArea;

    return (
      matchesQuery &&
      verifiedMatch &&
      fastMoveMatch &&
      areaMatch &&
      matchesBudget(listing, searchFilters.selectedBudget) &&
      matchesSize(listing, searchFilters.selectedSize)
    );
  });
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const {
    browseListings,
    savedListings,
    searchFilters,
    neighborhoodSuggestions,
    isListingUnlocked,
    updateSearchFilters,
  } = useMobileApp();
  const filteredListings = filterBrowseListings(browseListings, query, searchFilters);

  return (
    <Screen withTabBar>
      <Text className="font-display text-display-02 text-foreground">Search</Text>

      <View className="flex-row items-center gap-3">
        <Input
          className="flex-1"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by neighborhood…"
        />
        <Link href={appRoutes.filters} asChild>
          <Pressable className="h-12 w-12 items-center justify-center rounded-[12px] bg-surface-subtle active:opacity-80">
            <AppIcon name="options-outline" size={22} active />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {neighborhoodSuggestions.map((area) => (
          <Chip
            key={area}
            label={area}
            active={searchFilters.selectedArea === area}
            onPress={() =>
              updateSearchFilters({
                selectedArea: searchFilters.selectedArea === area ? null : area,
              })
            }
          />
        ))}
      </View>

      <Text className="font-body-medium text-label-md text-muted-foreground">
        {filteredListings.length} {filteredListings.length === 1 ? 'result' : 'results'}
        {savedListings.length > 0 ? ` · ${savedListings.length} saved` : ''}
      </Text>

      {filteredListings.length === 0 ? (
        <Card>
          <CardTitle>No homes match those filters</CardTitle>
          <CardDescription>
            Reset the filters or search a different area to expand the feed again.
          </CardDescription>
        </Card>
      ) : (
        filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
            actionLabel={isListingUnlocked(listing.id) ? 'Open Contact' : 'View Details'}
          />
        ))
      )}
    </Screen>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-display text-headline-sm text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

export function FiltersScreen() {
  const {
    searchFilters,
    updateSearchFilters,
    resetSearchFilters,
    filterBudgetOptions,
    filterSizeOptions,
    neighborhoodSuggestions,
    browseListings,
  } = useMobileApp();
  const router = useRouter();
  const resultCount = filterBrowseListings(browseListings, '', searchFilters).length;

  return (
    <Screen
      bottomBar={
        <View className="flex-row items-center gap-4">
          <Text className="flex-1 font-body-medium text-body-md text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'listing' : 'listings'}
          </Text>
          <Button className="flex-[2]" shape="pill" label="Show Results" onPress={() => router.back()} />
        </View>
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-display-02 text-foreground">Filters</Text>
        <Pressable className="px-2 py-1 active:opacity-70" onPress={resetSearchFilters}>
          <Text className="font-body-medium text-body-md text-primary">Clear All</Text>
        </Pressable>
      </View>

      <FilterSection title="Neighborhoods">
        <Chip
          label="Any"
          active={searchFilters.selectedArea === null}
          onPress={() => updateSearchFilters({ selectedArea: null })}
        />
        {neighborhoodSuggestions.map((area) => (
          <Chip
            key={area}
            label={area}
            active={searchFilters.selectedArea === area}
            onPress={() =>
              updateSearchFilters({
                selectedArea: searchFilters.selectedArea === area ? null : area,
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Rent Range">
        {filterBudgetOptions.map((budget) => (
          <Chip
            key={budget}
            label={budget}
            active={searchFilters.selectedBudget === budget}
            onPress={() => updateSearchFilters({ selectedBudget: budget })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Bedrooms">
        {filterSizeOptions.map((size) => (
          <Chip
            key={size}
            label={size}
            active={searchFilters.selectedSize === size}
            onPress={() => updateSearchFilters({ selectedSize: size })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Verification">
        <Chip
          label="Verified only"
          active={searchFilters.verifiedOnly}
          onPress={() => updateSearchFilters({ verifiedOnly: !searchFilters.verifiedOnly })}
        />
        <Chip
          label="Fast move"
          active={searchFilters.fastMove}
          onPress={() => updateSearchFilters({ fastMove: !searchFilters.fastMove })}
        />
      </FilterSection>
    </Screen>
  );
}

export function ListingStatsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById } = useMobileApp();
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen header={<ScreenHeader title="Listing Stats" />}>
        <Card>
          <CardTitle>Listing not found</CardTitle>
          <CardDescription>There is no analytics surface for that listing anymore.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const statCards = [
    { icon: 'eye-outline' as const, label: 'Views', value: listing.stats.views },
    { icon: 'lock-open-outline' as const, label: 'Unlocks', value: listing.stats.unlocks },
    { icon: 'heart-outline' as const, label: 'Saves', value: listing.stats.saves },
  ];

  return (
    <Screen header={<ScreenHeader title="Listing Stats" />}>
      <View className="gap-1">
        <Text className="font-display text-headline-md text-foreground">{listing.area}</Text>
        <Text className="font-body text-body-md text-muted-foreground">Performance overview</Text>
      </View>

      <View className="flex-row gap-3">
        {statCards.map((stat) => (
          <View key={stat.label} className="flex-1 gap-2 rounded-[16px] bg-card p-4 shadow-card">
            <AppIcon name={stat.icon} size={18} active />
            <Text className="font-display text-headline-md text-foreground">{stat.value}</Text>
            <Text className="font-body text-label-md text-muted-foreground">{stat.label}</Text>
          </View>
        ))}
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Unlock economics</Text>
        <Text className="font-body text-body-md text-muted-foreground">
          Unlock cost is {listing.unlockCost}. The mover pays a KES{' '}
          {listing.successFeeKes.toLocaleString()} success fee only at confirmed move-in, and you
          earn {listing.commissionAmount} of it.
        </Text>
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Freshness</Text>
        <Text className="font-body text-body-md text-muted-foreground">
          Last strong activity was {listing.stats.freshness}. Refreshing the gallery and handover
          notes usually improves conversion in busy areas.
        </Text>
      </View>
    </Screen>
  );
}

export function MapViewScreen() {
  const { browseListings, isListingUnlocked, searchFilters } = useMobileApp();
  const mapListings = filterBrowseListings(browseListings, '', searchFilters);
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(
    mapListings[0]?.id,
  );
  const selectedListing =
    mapListings.find((listing) => listing.id === selectedListingId) ?? mapListings[0];

  useEffect(() => {
    if (selectedListingId && mapListings.some((listing) => listing.id === selectedListingId)) {
      return;
    }

    setSelectedListingId(mapListings[0]?.id);
  }, [mapListings, selectedListingId]);

  return (
    <Screen>
      <Text className="font-display text-display-02 text-foreground">Map View</Text>

      {mapListings.length === 0 ? (
        <Card>
          <CardTitle>No listings match the current filters</CardTitle>
          <CardDescription>
            Adjust the browse filters to repopulate the map with approximate area pins.
          </CardDescription>
        </Card>
      ) : (
        <>
          <View className="overflow-hidden rounded-[16px] border border-border">
            <ListingsMap
              listings={mapListings}
              selectedListingId={selectedListing?.id}
              onSelectListing={setSelectedListingId}
            />
          </View>

          <View className="flex-row items-center gap-2 rounded-[12px] bg-accent-soft px-4 py-3">
            <AppIcon name="lock-closed-outline" size={16} active />
            <Text className="flex-1 font-body text-label-md text-foreground">
              Approximate pins. Exact address and GPS reveal only after unlock.
            </Text>
          </View>

          {selectedListing ? (
            <ListingCard
              listing={selectedListing}
              href={
                isListingUnlocked(selectedListing.id)
                  ? contactRevealedHref(selectedListing.id)
                  : listingHref(selectedListing.id)
              }
              actionLabel={isListingUnlocked(selectedListing.id) ? 'Open contact' : 'View details'}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

export function SavedListingsScreen() {
  const {
    savedListings,
    savedListingsState,
    isListingUnlocked,
    refreshSavedListings,
  } = useMobileApp();

  return (
    <Screen
      withTabBar
      refreshControl={
        <RefreshControl
          refreshing={savedListingsState.isRefreshing}
          onRefresh={() => void refreshSavedListings()}
        />
      }
    >
      <View className="gap-1">
        <Text className="font-display text-display-02 text-foreground">Saved</Text>
        <Text className="font-body text-body-md text-muted-foreground">
          {savedListings.length} {savedListings.length === 1 ? 'property' : 'properties'} shortlisted
        </Text>
      </View>

      {savedListings.length === 0 && savedListingsState.status === 'loading' ? (
        <View className="items-center gap-3 rounded-[16px] border border-border bg-surface-subtle px-6 py-12">
          <AppIcon name="reload-outline" size={28} />
          <Text className="font-body text-body-md text-muted-foreground">Loading saved homes…</Text>
        </View>
      ) : null}

      {savedListings.length === 0 && savedListingsState.status === 'error' ? (
        <View className="items-center gap-3 rounded-[16px] border border-border bg-surface-subtle px-6 py-12">
          <AppIcon name="cloud-offline-outline" size={28} />
          <Text className="text-center font-body text-body-md text-muted-foreground">
            {savedListingsState.error ?? 'We could not load your saved homes.'}
          </Text>
          <Button size="sm" label="Try again" onPress={() => void refreshSavedListings()} />
        </View>
      ) : null}

      {savedListings.length > 0 && savedListingsState.error ? (
        <View className="gap-3 rounded-[16px] border border-border bg-surface-subtle p-4">
          <Text className="font-body text-body-md text-muted-foreground">{savedListingsState.error}</Text>
          <Button size="sm" variant="outline" label="Retry" onPress={() => void refreshSavedListings()} />
        </View>
      ) : null}

      {savedListings.length === 0 && savedListingsState.status === 'ready' ? (
        <View className="items-center gap-3 rounded-[16px] border border-border bg-surface-subtle px-6 py-12">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
            <AppIcon name="heart-outline" size={26} active />
          </View>
          <Text className="font-display text-headline-sm text-foreground">No saved homes yet</Text>
          <Text className="text-center font-body text-body-md text-muted-foreground">
            Tap the heart on any listing to keep it on your shortlist.
          </Text>
        </View>
      ) : (
        savedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
            actionLabel={isListingUnlocked(listing.id) ? 'Open Contact' : 'View Details'}
          />
        ))
      )}
    </Screen>
  );
}

const NOTIFICATION_ICON: Record<
  NotificationCategory,
  { name: React.ComponentProps<typeof AppIcon>['name']; tint: string; color: string }
> = {
  unlocks: { name: 'lock-open-outline', tint: 'rgba(0,102,126,0.12)', color: '#00667E' },
  payments: { name: 'cash-outline', tint: 'rgba(52,199,89,0.15)', color: '#34C759' },
  listings: { name: 'home-outline', tint: 'rgba(0,102,126,0.12)', color: '#00667E' },
  other: { name: 'notifications-outline', tint: 'rgba(0,0,0,0.06)', color: '#8D9192' },
};

export function NotificationsScreen() {
  const { notifications } = useMobileApp();
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const groups = groupNotificationsByDay(filterNotifications(notifications, filter));

  function navigateTo(target: NotificationRecord['target']) {
    if (target.route === 'listing') return router.push(listingHref(target.id));
    if (target.route === 'credits') return router.push(appRoutes.credits);
    if (target.route === 'confirmations') return router.push(appRoutes.confirmations);
    if (target.route === 'my-listings') return router.push(appRoutes.myListings);
    return router.push(appRoutes.profile);
  }

  return (
    <Screen>
      <Text className="font-display text-display-02 text-foreground">Notifications</Text>

      <View className="flex-row flex-wrap gap-2">
        {notificationFilters.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            active={filter === chip.key}
            onPress={() => setFilter(chip.key)}
          />
        ))}
      </View>

      {groups.length === 0 ? (
        <View className="items-center gap-2 rounded-[16px] bg-surface-subtle py-12">
          <AppIcon name="notifications-off-outline" size={28} />
          <Text className="font-body text-body-md text-muted-foreground">You're all caught up</Text>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.day} className="gap-3">
          <Text className="font-display text-headline-sm text-foreground">{group.day}</Text>
          {group.items.map((notification) => {
            const meta = NOTIFICATION_ICON[notificationCategory(notification.target)];
            return (
              <Pressable
                key={notification.id}
                onPress={() => navigateTo(notification.target)}
                className="flex-row items-start gap-3 rounded-[16px] bg-card p-4 shadow-card active:opacity-90"
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: meta.tint }}
                >
                  <AppIcon name={meta.name} size={20} color={meta.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-body-lg text-foreground">{notification.title}</Text>
                  <Text className="mt-0.5 font-body text-body-md text-muted-foreground">
                    {notification.detail}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="font-body text-label-md text-muted-foreground">{notification.time}</Text>
                  {group.day === 'Today' ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { formatCredits, type ListingPreview, type SearchFilters } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ListingsMap } from '@/components/map/listings-map';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  appRoutes,
  contactRevealedHref,
  listingGalleryHref,
  listingHref,
  listingStatsHref,
  unlockHref,
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

function ActionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={active ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'}
      onPress={onPress}
    >
      <Text
        className={
          active
            ? 'text-sm font-semibold text-primary-foreground'
            : 'text-sm font-semibold text-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const { browseListings, savedListings, searchFilters, neighborhoodSuggestions, isListingUnlocked } =
    useMobileApp();
  const filteredListings = filterBrowseListings(browseListings, query, searchFilters);

  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Search and discover"
        title="Search homes"
        description="Search, save, compare"
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
        <Link href={appRoutes.map} asChild>
          <Button className="flex-1" variant="outline" label="Map view" />
        </Link>
        <Link href={appRoutes.saved} asChild>
          <Button className="flex-1" variant="outline" label={`Saved (${savedListings.length})`} />
        </Link>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {neighborhoodSuggestions.map((area) => (
          <Badge key={area} variant={searchFilters.selectedArea === area ? 'dark' : 'secondary'}>
            {area}
          </Badge>
        ))}
      </View>

      <Card>
        <Text className="text-sm text-foreground">
          {searchFilters.verifiedOnly ? 'Verified' : 'All'} | {searchFilters.selectedBudget} |{' '}
          {searchFilters.selectedSize}
        </Text>
      </Card>

      {filteredListings.length === 0 ? (
        <Card>
          <CardTitle className="text-[20px]">No listings match those filters</CardTitle>
          <CardDescription>
            Reset the filter sheet or search a different area to expand the feed again.
          </CardDescription>
        </Card>
      ) : (
        filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
            actionLabel={isListingUnlocked(listing.id) ? 'Open contact' : 'View details'}
          />
        ))
      )}
    </Screen>
  );
}

export function FiltersScreen() {
  const { searchFilters, updateSearchFilters, resetSearchFilters, filterBudgetOptions, filterSizeOptions, neighborhoodSuggestions } =
    useMobileApp();
  const router = useRouter();

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Button label="Apply filters" onPress={() => router.replace(appRoutes.search)} />
          <Button variant="outline" label="Reset" onPress={resetSearchFilters} />
        </View>
      }
    >
      <SectionHeader
        kicker="Filter sheet"
        title="Refine the feed"
        description="Stay in sync with search"
      />

      <Card>
        <Text className="text-sm font-semibold text-foreground">Verification</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <ActionChip
            label="Verified only"
            active={searchFilters.verifiedOnly}
            onPress={() => updateSearchFilters({ verifiedOnly: !searchFilters.verifiedOnly })}
          />
          <ActionChip
            label="Fast move"
            active={searchFilters.fastMove}
            onPress={() => updateSearchFilters({ fastMove: !searchFilters.fastMove })}
          />
        </View>
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Budget</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {filterBudgetOptions.map((budget) => (
            <ActionChip
              key={budget}
              label={budget}
              active={searchFilters.selectedBudget === budget}
              onPress={() => updateSearchFilters({ selectedBudget: budget })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Size</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {filterSizeOptions.map((size) => (
            <ActionChip
              key={size}
              label={size}
              active={searchFilters.selectedSize === size}
              onPress={() => updateSearchFilters({ selectedSize: size })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text className="text-sm font-semibold text-foreground">Area</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <ActionChip
            label="Any"
            active={searchFilters.selectedArea === null}
            onPress={() => updateSearchFilters({ selectedArea: null })}
          />
          {neighborhoodSuggestions.map((area) => (
            <ActionChip
              key={area}
              label={area}
              active={searchFilters.selectedArea === area}
              onPress={() => updateSearchFilters({ selectedArea: area })}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

export function ListingGalleryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, isListingUnlocked } = useMobileApp();
  const [slideIndex, setSlideIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const galleryRef = useRef<ScrollView | null>(null);
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Listing not found</CardTitle>
          <CardDescription>That gallery no longer has a listing attached.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const totalSlides = listing.galleryMedia.length;
  const currentSlide = listing.galleryMedia[slideIndex] ?? listing.galleryMedia[0];

  useEffect(() => {
    if (!galleryWidth || !galleryRef.current || slideIndex === 0) {
      return;
    }

    galleryRef.current.scrollTo({
      x: slideIndex * galleryWidth,
      animated: false,
    });
  }, [galleryWidth, slideIndex]);

  function goToSlide(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(totalSlides - 1, nextIndex));
    setSlideIndex(boundedIndex);

    if (!galleryRef.current || !galleryWidth) {
      return;
    }

    galleryRef.current.scrollTo({
      x: boundedIndex * galleryWidth,
      animated: true,
    });
  }

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              variant="outline"
              disabled={slideIndex === 0}
              label="Previous"
              onPress={() => goToSlide(slideIndex - 1)}
            />
            <Button
              className="flex-1"
              disabled={slideIndex === totalSlides - 1}
              label="Next"
              onPress={() => goToSlide(slideIndex + 1)}
            />
          </View>
          <Link href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : unlockHref(listing.id)} asChild>
            <Button variant="dark" label={isListingUnlocked(listing.id) ? 'Open contact' : 'Unlock listing'} />
          </Link>
        </View>
      }
    >
      <SectionHeader
        kicker={`Photo ${slideIndex + 1} of ${totalSlides}`}
        title={listing.title}
        description={currentSlide.label}
      />

      <View
        className="overflow-hidden rounded-[32px] bg-surface-inverse shadow-floating"
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;

          if (width !== galleryWidth) {
            setGalleryWidth(width);
          }
        }}
      >
        <ScrollView
          ref={galleryRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const width = galleryWidth || event.nativeEvent.layoutMeasurement.width;

            if (!width) {
              return;
            }

            setSlideIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          }}
        >
          {listing.galleryMedia.map((photo) => (
            <ImageBackground
              key={photo.id}
              className="h-96 bg-surface-inverse p-6"
              imageStyle={{ borderRadius: 32 }}
              source={photo.source}
              style={{ width: galleryWidth || 320 }}
            >
              <View className="absolute inset-0 bg-black/30" />
              <View className="flex-row items-start justify-between">
                <Badge variant="dark">{listing.area}</Badge>
                <Badge className="bg-primary" textClassName="text-primary-foreground">
                  {listing.photoCount}
                </Badge>
              </View>
              <View className="mt-auto gap-2">
                <Text className="text-[30px] font-semibold tracking-[-0.8px] text-white">
                  {photo.label}
                </Text>
                <Text className="text-sm text-white/70">Tenant-shot media</Text>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {listing.galleryMedia.map((photo, index) => (
          <ActionChip
            key={photo.id}
            label={`${index + 1}`}
            active={slideIndex === index}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>
    </Screen>
  );
}

export function ListingStatsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById } = useMobileApp();
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Listing not found</CardTitle>
          <CardDescription>There is no analytics surface for that listing anymore.</CardDescription>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        kicker="Listing analytics"
        title={`${listing.area} performance`}
        description="Views, saves, unlocks"
      />

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Views</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">{listing.stats.views}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Unlocks</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">{listing.stats.unlocks}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Saves</Text>
          <Text className="mt-3 text-[28px] font-semibold text-foreground">{listing.stats.saves}</Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-[20px]">Unlock economics</CardTitle>
        <CardDescription>
          Unlock cost is {listing.unlockCost}. Commission amount after both confirmations is{' '}
          {listing.commissionAmount}.
        </CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Freshness</CardTitle>
        <CardDescription>
          Last strong activity was {listing.stats.freshness}. Refreshing the gallery and handover notes
          usually improves conversion in busy areas.
        </CardDescription>
      </Card>
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
      <SectionHeader
        kicker="Map view"
        title="Listings by area"
        description="Approximate pins until unlock"
      />

      {mapListings.length === 0 ? (
        <Card>
          <CardTitle className="text-[20px]">No listings match the current filters</CardTitle>
          <CardDescription>
            Adjust the browse filters to repopulate the map with approximate area pins.
          </CardDescription>
        </Card>
      ) : (
        <>
          <View className="overflow-hidden rounded-[32px] border border-border">
            <ListingsMap
              listings={mapListings}
              selectedListingId={selectedListing?.id}
              onSelectListing={setSelectedListingId}
            />
          </View>

          <Card>
            <Text className="text-sm font-semibold text-foreground">
              {mapListings.length} listings visible on the map
            </Text>
            <CardDescription>
              Pins use approximate neighborhood coordinates in browse. Exact address and precise GPS
              still reveal only after unlock.
            </CardDescription>
          </Card>

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
  const { savedListings, isListingUnlocked } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Saved homes"
        title="Favorites"
        description="Your shortlist"
      />

      {savedListings.length === 0 ? (
        <Card>
          <CardTitle className="text-[20px]">No saved listings yet</CardTitle>
          <CardDescription>Use the heart action on a listing to keep it here.</CardDescription>
        </Card>
      ) : (
        savedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
            actionLabel={isListingUnlocked(listing.id) ? 'Open contact' : 'View details'}
          />
        ))
      )}
    </Screen>
  );
}

export function NotificationsScreen() {
  const { notifications } = useMobileApp();
  const router = useRouter();

  return (
    <Screen>
      <SectionHeader
        kicker="Activity feed"
        title="Notifications"
        description="Recent activity"
      />

      {notifications.map((notification) => (
        <Card key={notification.id}>
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">{notification.time}</Text>
          <CardTitle className="mt-3 text-[20px]">{notification.title}</CardTitle>
          <CardDescription>{notification.detail}</CardDescription>
          <Button
            className="mt-4"
            variant="outline"
            label="Open"
            onPress={() => {
              if (notification.target.route === 'listing') {
                router.push(listingHref(notification.target.id));
                return;
              }

              if (notification.target.route === 'credits') {
                router.push(appRoutes.credits);
                return;
              }

              if (notification.target.route === 'confirmations') {
                router.push(appRoutes.confirmations);
                return;
              }

              if (notification.target.route === 'my-listings') {
                router.push(appRoutes.myListings);
                return;
              }

              router.push(appRoutes.profile);
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}

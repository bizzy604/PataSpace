import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatCredits } from '@/data/mock-listings';
import { IconButton } from '@/components/ui/icon-button';
import { ListingCard } from '@/components/ui/listing-card';
import { MotionView } from '@/components/ui/motion-view';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, contactRevealedHref, listingHref } from '@/lib/routes';

export function HomeScreen() {
  const [selectedFilter, setSelectedFilter] = useState('For you');
  const { user, walletBalance, listingFilters, browseListings, latestUnlock, isListingUnlocked } =
    useMobileApp();

  const filteredListings = browseListings.filter((listing) => {
    if (selectedFilter === 'Verified') {
      return listing.status === 'Verified';
    }

    if (selectedFilter === 'Budget') {
      return listing.monthlyRent <= 18000;
    }

    if (selectedFilter === '2 BR') {
      return listing.meta.toLowerCase().includes('2 bed') || listing.title.toLowerCase().includes('2br');
    }

    return true;
  });

  return (
    <Screen withTabBar>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Text className="text-base font-semibold text-foreground">{user.initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground">Hello, {user.name.split(' ')[0]}</Text>
            <Text className="text-[28px] font-semibold tracking-[-0.8px] text-foreground">
              Find a place
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Link href={appRoutes.notifications} asChild>
            <IconButton icon="notifications-outline" />
          </Link>
          <Link href={appRoutes.search} asChild>
            <IconButton icon="search-outline" variant="accent" />
          </Link>
        </View>
      </View>

      <MotionView className="rounded-[28px] bg-surface-inverse p-6 shadow-floating" distance={14}>
        <Text className="text-sm font-medium text-white/70">Credit balance</Text>
        <View className="mt-4 flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[32px] font-semibold tracking-[-0.8px] text-white">
              {formatCredits(walletBalance)}
            </Text>
            <Text className="mt-1 text-sm text-white/70">Ready</Text>
          </View>
          <Link href={appRoutes.credits} asChild>
            <IconButton icon="wallet-outline" variant="accent" />
          </Link>
        </View>
      </MotionView>

      {latestUnlock ? (
        <Link href={appRoutes.confirmations} asChild>
          <Pressable className="rounded-[24px] bg-secondary p-5 active:opacity-90">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
              Latest unlock
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">Finish confirmation</Text>
            <Text className="mt-2 text-sm text-muted-foreground">Keep it moving</Text>
          </Pressable>
        </Link>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {listingFilters.map((filter) => (
          <Pressable
            key={filter}
            className={
              selectedFilter === filter ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'
            }
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              className={
                selectedFilter === filter
                  ? 'text-sm font-semibold text-primary-foreground'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[24px] font-semibold tracking-[-0.6px] text-foreground">
            Fresh matches
          </Text>
          <Text className="text-sm text-muted-foreground">New now</Text>
        </View>
        <Link href={appRoutes.browse}>
          <Text className="text-sm font-semibold text-primary">Browse all</Text>
        </Link>
      </View>

      {filteredListings.slice(0, 2).map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={isListingUnlocked(listing.id) ? contactRevealedHref(listing.id) : listingHref(listing.id)}
          actionLabel={isListingUnlocked(listing.id) ? 'Open contact' : 'View details'}
        />
      ))}

      <View className="flex-row gap-3">
        <Link href={appRoutes.createListing} asChild>
          <Pressable className="flex-1 rounded-[24px] bg-secondary p-5 active:opacity-90">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
              Post
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">New listing</Text>
            <Text className="mt-2 text-sm text-muted-foreground">Open camera</Text>
          </Pressable>
        </Link>
        <Link href={appRoutes.myListings} asChild>
          <Pressable className="flex-1 rounded-[24px] bg-secondary p-5 active:opacity-90">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
              Listings
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">Track status</Text>
            <Text className="mt-2 text-sm text-muted-foreground">Live and pending</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

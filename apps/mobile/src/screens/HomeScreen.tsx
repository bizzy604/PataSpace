import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { listingFilters, featuredListings } from '@/data/mock-listings';
import { IconButton } from '@/components/ui/icon-button';
import { ListingCard } from '@/components/ui/listing-card';
import { Screen } from '@/components/ui/screen';
import { listingHref } from '@/lib/routes';

export function HomeScreen() {
  return (
    <Screen withTabBar>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Text className="text-base font-semibold text-foreground">AK</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground">Hello, Amina</Text>
            <Text className="text-[28px] font-semibold tracking-[-0.8px] text-foreground">
              Ready to move faster?
            </Text>
          </View>
        </View>
        <Link href="/browse" asChild>
          <IconButton label="SR" />
        </Link>
      </View>

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-sm font-medium text-white/70">Credit balance</Text>
        <View className="mt-4 flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[32px] font-semibold tracking-[-0.8px] text-white">
              KES 5,000
            </Text>
            <Text className="mt-1 text-sm leading-6 text-white/70">
              Enough for about two unlocks in your current target range.
            </Text>
          </View>
          <Link href="/browse" asChild>
            <IconButton label="GO" variant="accent" />
          </Link>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {listingFilters.map((filter, index) => (
          <View
            key={filter}
            className={index === 0 ? 'rounded-full bg-primary px-4 py-2' : 'rounded-full bg-secondary px-4 py-2'}
          >
            <Text
              className={
                index === 0
                  ? 'text-sm font-semibold text-primary-foreground'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {filter}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[24px] font-semibold tracking-[-0.6px] text-foreground">
            Fresh matches
          </Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            Honest homes with enough detail to decide before you visit.
          </Text>
        </View>
        <Link href="/browse">
          <Text className="text-sm font-semibold text-primary">Browse all</Text>
        </Link>
      </View>

      {featuredListings.slice(0, 2).map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={listingHref(listing.id)}
          actionLabel="View details"
        />
      ))}

      <View className="flex-row gap-3">
        <Link href="/create-listing" asChild>
          <Pressable className="flex-1 rounded-[24px] bg-secondary p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
              Outgoing tenant
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">Post your listing</Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Start the camera checklist, attach GPS proof, and go live.
            </Text>
          </Pressable>
        </Link>
        <Link href="/my-listings" asChild>
          <Pressable className="flex-1 rounded-[24px] bg-secondary p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
              Current work
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">Track listings</Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Review unlocks, pending approval, and any payout waiting time.
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

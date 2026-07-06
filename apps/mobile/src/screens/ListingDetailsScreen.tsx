/**
 * Purpose: Full listing detail — hero, price/location, spec chips, a stat row,
 *   about, GPS-verified card, amenities grid, current-tenant quote, an
 *   approximate location panel, and the sticky Unlock Contact bar.
 *   Matches Main Flow 1-5/listing_details.
 * Why important: The conversion screen; the unlock CTA and its economics must
 *   stay exactly as wired.
 * Used by: app/listing.tsx.
 */
import { useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { contactRevealedHref, listingGalleryHref, unlockHref } from '@/lib/routes';

const AMENITY_PREVIEW = 6;

function specChips(meta: string): string[] {
  return meta
    .split('|')
    .map((part) => part.trim())
    .filter((part) => !/unlock/i.test(part));
}

export function ListingDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { getListingById, toggleSaved, isListingSaved, isListingUnlocked } = useMobileApp();
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle>Listing not found</CardTitle>
          <CardDescription>This property is no longer available.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const unlocked = isListingUnlocked(listing.id);
  const saved = isListingSaved(listing.id);
  const chips = specChips(listing.meta);
  const amenities = showAllAmenities ? listing.amenities : listing.amenities.slice(0, AMENITY_PREVIEW);

  return (
    <Screen
      contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0 }}
      bottomBar={
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <Text className="font-body text-label-md text-muted-foreground">Unlock Cost</Text>
            <Text className="font-display text-headline-sm text-foreground">{listing.unlockCost}</Text>
          </View>
          <Link href={unlocked ? contactRevealedHref(listing.id) : unlockHref(listing.id)} asChild>
            <Button
              className="flex-1"
              shape="pill"
              label={unlocked ? 'Open Contact' : 'Unlock Contact'}
            />
          </Link>
        </View>
      }
    >
      {/* Hero: the image opens the gallery; the overlaid controls are siblings
          (not children of the Link) so their taps stay independent. */}
      <View className="relative">
        <Link href={listingGalleryHref(listing.id)} asChild>
          <Pressable>
            <Image className="h-80 w-full bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
          </Pressable>
        </Link>
        <View
          className="absolute inset-x-0 top-0 flex-row items-center justify-between px-4 pt-3"
          pointerEvents="box-none"
        >
          <Pressable
            className="flex-row items-center gap-1 rounded-full bg-white/90 py-2 pl-2 pr-3 active:opacity-80"
            onPress={() => router.back()}
          >
            <AppIcon name="chevron-back" size={18} active />
            <Text className="font-body-medium text-body-md text-primary">Listings</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/90">
              <AppIcon name="share-outline" size={18} active />
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-80"
              onPress={() => toggleSaved(listing.id)}
            >
              <AppIcon name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#FF3B30' : undefined} active={!saved} />
            </Pressable>
          </View>
        </View>
      </View>

      <View className="gap-6 px-5 py-6">
        <View className="gap-3">
          <Text className="font-display text-headline-md text-primary">
            {listing.price}
            <Text className="font-body text-body-lg text-muted-foreground">/mo</Text>
          </Text>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="location-outline" size={16} active />
            <Text className="font-body-medium text-body-lg text-foreground">{listing.location}</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {chips.map((chip) => (
              <View key={chip} className="rounded-full border border-border px-3 py-1.5">
                <Text className="font-body-medium text-label-md text-foreground">{chip}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="calendar-outline" size={16} />
            <Text className="font-body text-body-md text-muted-foreground">{listing.availableFrom}</Text>
          </View>
        </View>

        <View className="flex-row rounded-[16px] bg-surface-subtle">
          {[
            { value: listing.stats.views, label: 'Views' },
            { value: listing.stats.unlocks, label: 'Unlocks' },
            { value: listing.stats.freshness, label: 'Listed ago' },
          ].map((stat, index) => (
            <View
              key={stat.label}
              className={`flex-1 items-center py-4 ${index > 0 ? 'border-l border-border' : ''}`}
            >
              <Text className="font-display text-headline-sm text-foreground">{stat.value}</Text>
              <Text className="font-body text-label-md text-muted-foreground">{stat.label}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Text className="font-display text-headline-sm text-foreground">About This Property</Text>
          <Text className="font-body text-body-lg leading-6 text-muted-foreground">{listing.blurb}</Text>
        </View>

        <View className="flex-row items-center gap-3 rounded-[16px] bg-success/10 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <AppIcon name="shield-checkmark" size={20} color="#34C759" />
          </View>
          <View className="flex-1">
            <Text className="font-display text-body-lg text-foreground">GPS Verified Listing</Text>
            <Text className="font-body text-label-md text-muted-foreground">
              Photos were taken at this exact location by the PataSpace team or a verified agent.
            </Text>
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-display text-headline-sm text-foreground">Amenities</Text>
          <View className="flex-row flex-wrap">
            {amenities.map((amenity) => (
              <View key={amenity} className="w-1/2 flex-row items-center gap-2 py-2">
                <AppIcon name="checkmark-circle" size={18} color="#34C759" />
                <Text className="font-body text-body-md text-foreground">{amenity}</Text>
              </View>
            ))}
          </View>
          {listing.amenities.length > AMENITY_PREVIEW ? (
            <Button
              variant="outline"
              label={showAllAmenities ? 'Show fewer amenities' : `Show all ${listing.amenities.length} amenities`}
              onPress={() => setShowAllAmenities((current) => !current)}
            />
          ) : null}
        </View>

        <View className="gap-4">
          <Text className="font-display text-headline-sm text-foreground">From Current Tenant</Text>
          <View className="flex-row gap-3 rounded-[16px] border-l-4 border-primary bg-surface-subtle p-4">
            <View className="flex-1 gap-3">
              <Text className="font-body italic leading-6 text-foreground">“{listing.quote}”</Text>
              <Text className="font-body-medium text-label-md text-muted-foreground">
                {listing.quoteAuthor}
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <Text className="font-display text-headline-sm text-foreground">Location</Text>
          <View className="items-center justify-center gap-2 rounded-[16px] border border-border bg-surface-subtle py-10">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <AppIcon name="location" size={24} active />
            </View>
            <Text className="font-body-medium text-body-md text-foreground">{listing.area}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="lock-closed-outline" size={14} />
            <Text className="font-body text-label-md text-muted-foreground">
              Exact address revealed after unlock
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

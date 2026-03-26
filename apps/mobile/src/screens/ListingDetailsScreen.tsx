import { Link, useLocalSearchParams } from 'expo-router';
import { ImageBackground, Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  appRoutes,
  contactRevealedHref,
  listingGalleryHref,
  listingStatsHref,
  unlockHref,
} from '@/lib/routes';

export function ListingDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, toggleSaved, isListingSaved, isListingUnlocked } = useMobileApp();
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Listing not found</CardTitle>
          <CardDescription>This property is no longer available in the current demo data.</CardDescription>
        </Card>
        <Link href={appRoutes.search} asChild>
          <Button label="Back to search" />
        </Link>
      </Screen>
    );
  }

  const unlocked = isListingUnlocked(listing.id);
  const saved = isListingSaved(listing.id);

  return (
    <Screen
      bottomBar={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Unlock cost
            </Text>
            <Text className="mt-1 text-lg font-semibold text-foreground">{listing.unlockCost}</Text>
          </View>
          <Link href={unlocked ? contactRevealedHref(listing.id) : unlockHref(listing.id)} asChild>
            <Button className="flex-1" label={unlocked ? 'Open contact' : 'Unlock contact'} />
          </Link>
        </View>
      }
    >
      <Link href={appRoutes.browse}>
        <Text className="text-sm font-semibold text-primary">Back</Text>
      </Link>

      <ImageBackground
        className="h-72 overflow-hidden rounded-[32px] bg-surface-inverse p-6 shadow-floating"
        imageStyle={{ borderRadius: 32 }}
        source={listing.coverImage}
      >
        <View className="absolute inset-0 bg-black/32" />
        <View className="flex-row items-start justify-between">
          <Badge variant="dark">{listing.status}</Badge>
          <Badge className="bg-primary" textClassName="text-primary-foreground">
            {listing.photoCount}
          </Badge>
        </View>

        <View className="mt-auto gap-2">
          <Text className="text-[30px] font-semibold tracking-[-0.8px] text-white">{listing.area}</Text>
          <Text className="text-sm text-white/70" numberOfLines={1}>
            {listing.imageHint}
          </Text>
        </View>
      </ImageBackground>

      <View className="gap-2">
        <Text className="text-[32px] font-semibold tracking-[-0.8px] text-foreground">
          {listing.price}
        </Text>
        <Text className="text-[22px] font-semibold tracking-[-0.5px] text-foreground">
          {listing.title}
        </Text>
        <Text className="text-[15px] leading-6 text-muted-foreground">{listing.location}</Text>
        <View className="flex-row flex-wrap gap-2">
          {listing.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </View>
        <Text className="text-sm font-medium text-muted-foreground">{listing.availableFrom}</Text>
      </View>

      <View className="flex-row gap-3">
        <Link href={listingGalleryHref(listing.id)} asChild>
          <Button className="flex-1" variant="outline" label="Photo gallery" />
        </Link>
        <Link href={listingStatsHref(listing.id)} asChild>
          <Button className="flex-1" variant="outline" label="Stats" />
        </Link>
      </View>

      <View className="flex-row gap-3">
        <Button
          className="flex-1"
          variant={saved ? 'dark' : 'secondary'}
          label={saved ? 'Saved' : 'Save listing'}
          onPress={() => toggleSaved(listing.id)}
        />
        <Link href={appRoutes.map} asChild>
          <Button className="flex-1" variant="secondary" label="Map view" />
        </Link>
      </View>

      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Views</Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">{listing.stats.views}</Text>
          </View>
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Unlocks</Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">{listing.stats.unlocks}</Text>
          </View>
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Saves</Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">{listing.stats.saves}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">About</CardTitle>
        <CardDescription>{listing.blurb}</CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Amenities</CardTitle>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <View key={amenity} className="rounded-full bg-secondary px-4 py-2">
              <Text className="text-sm font-medium text-foreground">{amenity}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Tenant note</CardTitle>
        <View className="mt-4 flex-row gap-3">
          <View className="w-1 rounded-full bg-primary" />
          <View className="flex-1 gap-2">
            <Text className="text-[15px] leading-6 text-foreground">"{listing.quote}"</Text>
            <Text className="text-sm font-medium text-muted-foreground">{listing.quoteAuthor}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Verified</CardTitle>
        <View className="mt-4 rounded-[20px] bg-secondary p-5">
          <Text className="text-sm font-semibold text-foreground">GPS verified</Text>
          <Text className="mt-2 text-sm text-muted-foreground">Address reveals after unlock.</Text>
        </View>
      </Card>
    </Screen>
  );
}

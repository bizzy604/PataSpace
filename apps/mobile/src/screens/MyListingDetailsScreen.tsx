import { Link, useLocalSearchParams } from 'expo-router';
import { ImageBackground, Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  appRoutes,
  listingGalleryHref,
  listingStatsHref,
} from '@/lib/routes';

export function MyListingDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, myListings } = useMobileApp();
  const listing = getListingById(params.id);
  const listingRow = myListings.find((item) => item.id === (Array.isArray(params.id) ? params.id[0] : params.id));

  if (!listing || !listingRow) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Listing not found</CardTitle>
          <CardDescription>
            That owner listing is no longer available in the current demo data.
          </CardDescription>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      bottomBar={
        <View className="flex-row gap-3">
          <Link href={listingGalleryHref(listing.id)} asChild>
            <Button className="flex-1" variant="outline" label="Photo gallery" />
          </Link>
          <Link href={listingStatsHref(listing.id)} asChild>
            <Button className="flex-1" label="Listing stats" />
          </Link>
        </View>
      }
    >
      <SectionHeader
        kicker="Outgoing dashboard"
        title={listing.title}
        description={listingRow.updated}
      />

      <ImageBackground
        className="h-72 overflow-hidden rounded-[32px] bg-surface-inverse p-6 shadow-floating"
        imageStyle={{ borderRadius: 32 }}
        source={listing.coverImage}
      >
        <View className="absolute inset-0 bg-black/32" />
        <View className="flex-row items-start justify-between">
          <Badge variant={listingRow.status === 'Live' ? 'dark' : 'secondary'}>
            {listingRow.status}
          </Badge>
          <Badge className="bg-primary" textClassName="text-primary-foreground">
            {listing.photoCount}
          </Badge>
        </View>

        <View className="mt-auto gap-2">
          <Text className="text-[30px] font-semibold tracking-[-0.8px] text-white">
            {listing.area}
          </Text>
          <Text className="text-sm text-white/75" numberOfLines={1}>
            {listing.price} | {listing.location}
          </Text>
        </View>
      </ImageBackground>

      <View className="gap-2">
        <Text className="text-[32px] font-semibold tracking-[-0.8px] text-foreground">
          {listing.price}
        </Text>
        <Text className="text-[15px] leading-6 text-muted-foreground">{listing.location}</Text>
        <View className="flex-row flex-wrap gap-2">
          {listing.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </View>
      </View>

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Views</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">{listingRow.views}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Unlocks</Text>
          <Text className="mt-2 text-[24px] font-semibold text-foreground">{listingRow.unlocks}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Status</Text>
          <Text className="mt-2 text-[20px] font-semibold text-foreground">{listingRow.status}</Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-[20px]">Performance</CardTitle>
        <CardDescription>
          {listing.stats.views} views, {listing.stats.unlocks} unlocks, and {listing.stats.saves} saves
          in the current prototype data.
        </CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Payout status</CardTitle>
        <CardDescription>{listingRow.payout}</CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Review note</CardTitle>
        <CardDescription>{listingRow.reviewNote}</CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Listing summary</CardTitle>
        <CardDescription>{listing.blurb}</CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Move-out context</CardTitle>
        <CardDescription>{listing.moveReason}</CardDescription>
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
    </Screen>
  );
}

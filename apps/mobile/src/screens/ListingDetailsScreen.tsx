import { Link, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { getListingById } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

export function ListingDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const listing = getListingById(params.id);

  return (
    <Screen
      bottomBar={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Unlock cost
            </Text>
            <Text className="mt-1 text-lg font-semibold text-foreground">
              {listing.unlockCost}
            </Text>
          </View>
          <Link href={{ pathname: '/unlock', params: { id: listing.id } }} asChild>
            <Button className="flex-1" label="Unlock contact" />
          </Link>
        </View>
      }
    >
      <Link href="/browse">
        <Text className="text-sm font-semibold text-primary">Back to browse</Text>
      </Link>

      <View className="h-72 rounded-[32px] bg-surface-inverse p-6 shadow-floating">
        <View className="flex-row items-start justify-between">
          <Badge variant="dark">{listing.status}</Badge>
          <Badge className="bg-primary" textClassName="text-primary-foreground">
            {listing.photoCount}
          </Badge>
        </View>

        <View className="mt-auto gap-2">
          <Text className="text-[30px] font-semibold tracking-[-0.8px] text-white">
            {listing.area}
          </Text>
          <Text className="text-sm leading-6 text-white/70">{listing.imageHint}</Text>
        </View>
      </View>

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

      <Card>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">Views</Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">{listing.stats.views}</Text>
          </View>
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Unlocks
            </Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">
              {listing.stats.unlocks}
            </Text>
          </View>
          <View className="flex-1 rounded-[18px] bg-secondary p-4">
            <Text className="text-xs uppercase tracking-[1.8px] text-muted-foreground">
              Freshness
            </Text>
            <Text className="mt-2 text-xl font-semibold text-foreground">
              {listing.stats.freshness}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">About this home</CardTitle>
        <CardDescription>
          {listing.blurb} The layout and building notes are structured so renters can judge fit before arranging a visit.
        </CardDescription>
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
        <CardTitle className="text-[20px]">From the current tenant</CardTitle>
        <View className="mt-4 flex-row gap-3">
          <View className="w-1 rounded-full bg-primary" />
          <View className="flex-1 gap-2">
            <Text className="text-[15px] leading-6 text-foreground">"{listing.quote}"</Text>
            <Text className="text-sm font-medium text-muted-foreground">{listing.quoteAuthor}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <CardTitle className="text-[20px]">Location and verification</CardTitle>
        <View className="mt-4 rounded-[20px] bg-secondary p-5">
          <Text className="text-sm font-semibold text-foreground">GPS verified</Text>
          <Text className="mt-2 text-sm leading-6 text-muted-foreground">
            The exact address and pin are revealed after unlock. This listing already has photo-level location evidence attached.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

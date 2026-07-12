/**
 * Purpose: The "how buyers will see it" preview card on the listing review
 * step: hero photo, title, location, price, and house type.
 * Why important: keeps the review screen focused on gating and submission;
 * this card is pure presentation over the draft.
 * Used by: ListingReviewScreen.
 */
import { Image, Text, View } from 'react-native';
import { formatListingHouseType } from '@/data/mock-listings';
import type { ListingDraft } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';

export function ListingPreviewCard({
  draft,
  monthlyRent,
}: {
  draft: ListingDraft;
  monthlyRent: number;
}) {
  const heroPhoto = draft.photos[0];

  return (
    <View className="overflow-hidden rounded-[16px] bg-card shadow-card">
      {heroPhoto ? (
        <View className="relative">
          <Image className="h-56 w-full bg-surface-subtle" resizeMode="cover" source={heroPhoto.source} />
          <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
            <AppIcon name="shield-checkmark" size={13} color="#FFFFFF" />
            <Text className="font-body-medium text-caption text-white">New</Text>
          </View>
        </View>
      ) : (
        <View className="h-56 w-full items-center justify-center bg-surface-subtle">
          <AppIcon name="camera" size={28} />
          <Text className="mt-2 font-body text-body-md text-muted-foreground">No photo captured</Text>
        </View>
      )}
      <View className="gap-2 p-4">
        <Text className="font-display text-headline-sm text-foreground">
          {draft.title || 'Untitled listing'}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <AppIcon name="location-outline" size={15} active />
          <Text className="font-body text-body-md text-muted-foreground">
            {draft.area}
            {draft.county ? `, ${draft.county}` : ''}
          </Text>
        </View>
        <View className="h-px bg-border" />
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
              Asking Price
            </Text>
            <Text className="font-display text-headline-md text-primary">
              KES {monthlyRent.toLocaleString()}
              <Text className="font-body text-body-md text-muted-foreground">/mo</Text>
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1.5">
            <AppIcon name="bed-outline" size={16} active />
            <Text className="font-body-medium text-label-md text-foreground">
              {formatListingHouseType(draft.houseType)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

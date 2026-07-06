/**
 * Purpose: Browse listing card — clean photo with an availability badge, then a
 *   white body with teal price, location, a bed/bath/unlocks meta row, a
 *   truncated blurb, and a "View Details" link (Main Flow 1-5/home_browse).
 * Why important: The single card used across home, search, saved, and map;
 *   restyling it here updates every browse surface at once.
 * Used by: HomeScreen, BrowseListingsScreen, ExploreScreens (search/map/saved).
 */
import type { ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import type { ListingPreview } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Card } from '@/components/ui/card';
import { MotionView } from '@/components/ui/motion-view';
import { cn } from '@/lib/cn';

type ListingCardProps = {
  listing: ListingPreview;
  href: Href;
  actionLabel: string;
  className?: string;
  footer?: ReactNode;
};

type MetaItem = { icon: Parameters<typeof AppIcon>[0]['name']; label: string };

// meta is pipe-separated, e.g. "2 bed | 1 bath | Apartment | 3 unlocks". Pull
// the bed / bath / unlocks parts for the icon row (property type shows as a
// chip on the details screen, not here).
function metaItems(meta: string): MetaItem[] {
  const parts = meta.split('|').map((part) => part.trim());
  const bed = parts.find((part) => /bed|studio/i.test(part));
  const bath = parts.find((part) => /bath/i.test(part));
  const unlocks = parts.find((part) => /unlock/i.test(part));
  const items: MetaItem[] = [];
  if (bed) items.push({ icon: 'bed-outline', label: bed });
  if (bath) items.push({ icon: 'water-outline', label: bath });
  if (unlocks) items.push({ icon: 'lock-open-outline', label: unlocks });
  return items;
}

export function ListingCard({ listing, href, actionLabel, className, footer }: ListingCardProps) {
  const items = metaItems(listing.meta);

  return (
    <MotionView distance={16}>
      <Card className={cn('gap-0 overflow-hidden p-0', className)}>
        <View className="relative">
          <Image className="h-52 w-full bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
          <View className="absolute right-3 top-3 rounded-full bg-success px-3 py-1.5">
            <Text className="font-body-bold text-label-md text-white">{listing.status}</Text>
          </View>
        </View>

        <View className="gap-3 p-4">
          <Text className="font-display text-headline-sm text-primary">
            {listing.price}
            <Text className="font-body text-body-md text-muted-foreground">/mo</Text>
          </Text>

          <View className="flex-row items-center gap-1.5">
            <AppIcon name="location-outline" size={16} active />
            <Text className="font-body-medium text-body-md text-foreground">{listing.location}</Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {items.map((item, index) => (
              <View key={item.label} className="flex-row items-center gap-3">
                {index > 0 ? <View className="h-1 w-1 rounded-full bg-outline-variant" /> : null}
                <View className="flex-row items-center gap-1.5">
                  <AppIcon name={item.icon} size={16} />
                  <Text className="font-body text-label-md text-muted-foreground">{item.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text className="font-body text-body-md text-muted-foreground" numberOfLines={1}>
            {listing.blurb}
          </Text>

          {footer ?? (
            <>
              <View className="h-px bg-border" />
              <Link href={href} asChild>
                <Pressable className="flex-row items-center justify-end gap-1 active:opacity-70">
                  <Text className="font-display text-body-md text-primary">{actionLabel}</Text>
                  <AppIcon name="chevron-forward" size={16} active />
                </Pressable>
              </Link>
            </>
          )}
        </View>
      </Card>
    </MotionView>
  );
}

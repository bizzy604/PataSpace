import type { ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import { ImageBackground, Text, View } from 'react-native';
import type { ListingPreview } from '@/data/mock-listings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function ListingCard({
  listing,
  href,
  actionLabel,
  className,
  footer,
}: ListingCardProps) {
  return (
    <MotionView distance={16}>
      <Card className={cn('gap-4 p-4', className)}>
        <ImageBackground
          className="h-40 overflow-hidden rounded-[22px] bg-surface-inverse p-4"
          imageStyle={{ borderRadius: 22 }}
          source={listing.coverImage}
        >
          <View className="absolute inset-0 bg-black/35" />
          <View className="flex-row items-start justify-between">
            <Badge variant="dark">{listing.status}</Badge>
            <Badge className="bg-primary" textClassName="text-primary-foreground">
              {listing.photoCount}
            </Badge>
          </View>
          <View className="mt-auto gap-1">
            <Text className="text-lg font-semibold text-primary-foreground">{listing.area}</Text>
            <Text className="text-sm text-white/70" numberOfLines={1}>
              {listing.imageHint}
            </Text>
          </View>
        </ImageBackground>

        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-[24px] font-semibold tracking-[-0.6px] text-foreground">
                {listing.price}
              </Text>
              <Text className="text-lg font-semibold text-foreground">{listing.title}</Text>
            </View>
            <Badge variant="secondary">{listing.unlockCost}</Badge>
          </View>
          <Text className="text-sm font-medium text-muted-foreground" numberOfLines={1}>
            {listing.location}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {listing.meta}
          </Text>
          <Text className="text-[14px] leading-5 text-muted-foreground" numberOfLines={1}>
            {listing.blurb}
          </Text>
        </View>

        {footer ?? (
          <Link href={href} asChild>
            <Button label={actionLabel} />
          </Link>
        )}
      </Card>
    </MotionView>
  );
}

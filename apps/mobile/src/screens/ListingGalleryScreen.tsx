/**
 * Purpose: Full-screen media gallery — swipeable photo pager, thumbnail strip,
 *   GPS-verified badge, and the walkthrough video as the final slide.
 * Why important: The only place a tenant inspects every photo and the video
 *   the poster uploaded; it must render the real fetched media, not the thin
 *   feed preview (which carries no gallery at all).
 * Used by: app/listing-gallery.tsx.
 */
import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { useListingDetails } from '@/features/mobile-app/use-listing-details';
import { mergeListingDetails } from '@/lib/listings/listing-details-view';
import type { ListingMedia } from '@/data/mock-listings';

type GallerySlide =
  | { id: string; kind: 'photo'; media: ListingMedia }
  | { id: 'video'; kind: 'video'; url: string };

function VideoSlide({ url, width }: { url: string; width: number }) {
  const player = useVideoPlayer(url);

  return (
    <View className="items-center justify-center" style={{ width }}>
      <VideoView player={player} style={{ width, height: '100%' }} contentFit="contain" />
    </View>
  );
}

export function ListingGalleryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { getListingById } = useMobileApp();
  const { details, loading } = useListingDetails(params.id);
  const [slideIndex, setSlideIndex] = useState(0);
  const galleryRef = useRef<ScrollView | null>(null);
  const listing = mergeListingDetails(getListingById(params.id), details);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle>{loading ? 'Loading gallery…' : 'Listing not found'}</CardTitle>
          <CardDescription>
            {loading
              ? 'Fetching the latest photos for this listing.'
              : 'That gallery no longer has a listing attached.'}
          </CardDescription>
        </Card>
      </Screen>
    );
  }

  const slides: GallerySlide[] = listing.galleryMedia.map((media) => ({
    id: media.id,
    kind: 'photo',
    media,
  }));
  if (details?.video?.url) {
    slides.push({ id: 'video', kind: 'video', url: details.video.url });
  }

  const totalSlides = slides.length;
  const coords = listing.mapLocation
    ? `${Math.abs(listing.mapLocation.approxLatitude).toFixed(4)}° ${listing.mapLocation.approxLatitude < 0 ? 'S' : 'N'}, ${Math.abs(listing.mapLocation.approxLongitude).toFixed(4)}° ${listing.mapLocation.approxLongitude < 0 ? 'W' : 'E'}`
    : null;

  function goToSlide(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(totalSlides - 1, nextIndex));
    setSlideIndex(boundedIndex);
    galleryRef.current?.scrollTo({ x: boundedIndex * width, animated: true });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-black">
      <StatusBar style="light" />
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          className="h-10 w-10 items-center justify-center active:opacity-70"
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityLabel="Close gallery"
        >
          <AppIcon name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="font-body-medium text-body-lg text-white">
          {totalSlides === 0 ? 'No media yet' : `${slideIndex + 1} of ${totalSlides}`}
        </Text>
        <View className="h-10 w-10 items-center justify-center">
          <AppIcon name="share-outline" size={22} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        ref={galleryRef}
        className="flex-1"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          if (!width) return;
          setSlideIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
      >
        {slides.map((slide) =>
          slide.kind === 'photo' ? (
            <View key={slide.id} className="items-center justify-center" style={{ width }}>
              <Image
                source={slide.media.source}
                resizeMode="contain"
                style={{ width, height: '100%' }}
              />
            </View>
          ) : (
            <VideoSlide key={slide.id} url={slide.url} width={width} />
          ),
        )}
      </ScrollView>

      {coords ? (
        <View className="items-center py-3">
          <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <AppIcon name="shield-checkmark" size={16} color="#34C759" />
            <Text className="font-body-medium text-label-md text-white">GPS Verified ({coords})</Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        className="max-h-24 py-2"
      >
        {slides.map((slide, index) => (
          <Pressable
            key={slide.id}
            onPress={() => goToSlide(index)}
            className={`overflow-hidden rounded-[10px] border-2 ${slideIndex === index ? 'border-primary' : 'border-transparent'}`}
          >
            {slide.kind === 'photo' ? (
              <Image source={slide.media.source} resizeMode="cover" className="h-16 w-20 bg-white/10" />
            ) : (
              <View className="h-16 w-20 items-center justify-center bg-white/10">
                <AppIcon name="play-circle" size={28} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

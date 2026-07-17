/**
 * Purpose: Owner listing detail — hero, performance, payout, the move-out
 *   confirmation each incoming unlock needs, and the commission timeline.
 * Why important: Where the supply side confirms move-outs so commission can
 *   proceed; restyled onto the redesign kit with no data-flow changes.
 * Used by: app/my-listing.tsx.
 */
import { useEffect } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { OutgoingUnlockRow } from '@/components/listing/outgoing-unlock-row';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { useListingDetails } from '@/features/mobile-app/use-listing-details';
import { mergeListingDetails } from '@/lib/listings/listing-details-view';
import { appRoutes, listingGalleryHref, listingStatsHref } from '@/lib/routes';

export function MyListingDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    getListingById,
    myListings,
    getReceivedUnlocksForListing,
    confirmReceivedUnlock,
    refreshReceivedUnlocks,
  } = useMobileApp();
  // The public feed may not carry this listing (pending review, or feed not
  // loaded); the detail fetch is authoritative for an owner's own listing.
  const { details, loading } = useListingDetails(params.id);
  const listing = mergeListingDetails(getListingById(params.id), details);
  const listingRow = myListings.find(
    (item) => item.id === (Array.isArray(params.id) ? params.id[0] : params.id),
  );

  // Pull the latest received unlocks on open so a freshly unlocked listing shows
  // its pending confirmation immediately, not only after the sign-in sync.
  useEffect(() => {
    void refreshReceivedUnlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingRow?.id]);

  const receivedUnlocks = listingRow ? getReceivedUnlocksForListing(listingRow.id) : [];
  const pendingConfirmation = receivedUnlocks.filter(
    (unlock) => !unlock.outgoingConfirmed && !unlock.isRefunded && unlock.status !== 'disputed',
  );

  if (!listing || !listingRow) {
    return (
      <Screen header={<ScreenHeader title="Listing" />}>
        <Card>
          <CardTitle>{loading ? 'Loading listing…' : 'Listing not found'}</CardTitle>
          <CardDescription>
            {loading
              ? 'Fetching the latest details for your listing.'
              : 'We could not load this listing. Check your connection and try again.'}
          </CardDescription>
        </Card>
      </Screen>
    );
  }

  const statusVariant = listingRow.status === 'Live' ? 'success' : 'warning';

  return (
    <Screen
      header={<ScreenHeader title="Listing" />}
      bottomBar={
        <View className="flex-row gap-3">
          <Link href={listingGalleryHref(listing.id)} asChild>
            <Button className="flex-1" shape="pill" variant="outline" label="Photo Gallery" />
          </Link>
          <Link href={listingStatsHref(listing.id)} asChild>
            <Button className="flex-1" shape="pill" label="Listing Stats" />
          </Link>
        </View>
      }
    >
      <View className="overflow-hidden rounded-[16px] bg-card shadow-card">
        <View className="relative">
          <Image className="h-52 w-full bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
          <View className="absolute left-3 top-3">
            <Badge variant={statusVariant}>{listingRow.status}</Badge>
          </View>
          <View className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1">
            <Text className="font-body-medium text-caption text-white">{listing.photoCount}</Text>
          </View>
        </View>
        <View className="gap-2 p-4">
          <Text className="font-display text-headline-md text-primary">{listing.price}</Text>
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="location-outline" size={15} active />
            <Text className="font-body text-body-md text-muted-foreground">{listing.location}</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <View key={tag} className="rounded-full bg-surface-subtle px-3 py-1">
                <Text className="font-body-medium text-label-md text-foreground">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        {[
          { label: 'Views', value: listingRow.views },
          { label: 'Unlocks', value: listingRow.unlocks },
          { label: 'Status', value: listingRow.status },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 gap-1 rounded-[16px] bg-card p-4 shadow-card">
            <Text className="font-body text-label-md text-muted-foreground">{stat.label}</Text>
            <Text className="font-display text-body-lg text-foreground">{stat.value}</Text>
          </View>
        ))}
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Payout status</Text>
        <Text className="font-body text-body-md text-muted-foreground">{listingRow.payout}</Text>
      </View>

      <View className="gap-3 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Confirm your move-out</Text>
        {receivedUnlocks.length === 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            No one has unlocked this listing yet. When an incoming tenant unlocks it, confirm your
            move-out here so the commission can proceed.
          </Text>
        ) : pendingConfirmation.length === 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            Nothing needs your confirmation right now. Confirmed unlocks move to the commission
            timeline below.
          </Text>
        ) : (
          <View className="gap-3">
            {pendingConfirmation.map((unlock) => (
              <OutgoingUnlockRow
                key={unlock.unlockId}
                unlock={unlock}
                onConfirm={confirmReceivedUnlock}
              />
            ))}
          </View>
        )}
      </View>

      <View className="gap-3 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Commission timeline</Text>
        {listingRow.commissions.length === 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            No commissions yet. They appear here once both parties confirm an unlock.
          </Text>
        ) : (
          <View className="gap-3">
            {listingRow.commissions.map((commission) => (
              <View key={commission.unlockId} className="gap-1 rounded-[12px] bg-surface-subtle p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="font-body-medium text-body-md text-foreground">
                    KES {commission.amountKES.toLocaleString()}
                  </Text>
                  <Badge variant={commission.status === 'PAID' ? 'success' : 'secondary'}>
                    {commission.status}
                  </Badge>
                </View>
                <Text className="font-body text-label-md text-muted-foreground">
                  {commission.paidAt
                    ? `Paid ${new Date(commission.paidAt).toLocaleDateString('en-KE')}`
                    : commission.eligibleAt
                      ? `Eligible from ${new Date(commission.eligibleAt).toLocaleDateString('en-KE')}`
                      : 'Awaiting confirmation lock-in'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Review note</Text>
        <Text className="font-body text-body-md text-muted-foreground">{listingRow.reviewNote}</Text>
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Listing summary</Text>
        <Text className="font-body text-body-md text-muted-foreground">{listing.blurb}</Text>
        <Text className="mt-2 font-body-medium text-label-md text-muted-foreground">Move-out context</Text>
        <Text className="font-body text-body-md text-muted-foreground">{listing.moveReason}</Text>
      </View>

      <View className="gap-3 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">Amenities</Text>
        <View className="flex-row flex-wrap gap-2">
          {listing.amenities.map((amenity) => (
            <View key={amenity} className="rounded-full bg-surface-subtle px-3 py-1.5">
              <Text className="font-body-medium text-label-md text-foreground">{amenity}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

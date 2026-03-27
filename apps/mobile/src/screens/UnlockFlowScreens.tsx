import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RevealedLocationMap } from '@/components/map/revealed-location-map';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

export function ContactRevealedScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, getUnlockRecord, confirmIncoming } = useMobileApp();
  const router = useRouter();
  const listing = getListingById(params.id);
  const unlock = getUnlockRecord(params.id);
  const latitude = unlock?.contactInfo.latitude;
  const longitude = unlock?.contactInfo.longitude;

  if (!listing || !unlock) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">No unlocked contact yet</CardTitle>
          <CardDescription>Unlock a listing first to reveal the outgoing tenant contact details.</CardDescription>
        </Card>
        <Link href={appRoutes.search} asChild>
          <Button label="Browse listings" />
        </Link>
      </Screen>
    );
  }

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Button
            label={unlock.incomingConfirmed ? 'Incoming confirmation recorded' : 'I have contacted this tenant'}
            disabled={unlock.incomingConfirmed}
            onPress={() => {
              confirmIncoming(listing.id);
              router.push(appRoutes.confirmations);
            }}
          />
        </View>
      }
    >
      <SectionHeader
        kicker="Contact revealed"
        title={listing.title}
        description="A valid unlock now exposes the outgoing tenant contact details, exact directions, and precise GPS."
      />

      <Card>
        <CardTitle className="text-[20px]">Phone number</CardTitle>
        <CardDescription>{unlock.contactInfo.phoneNumber}</CardDescription>
      </Card>
      <Card>
        <CardTitle className="text-[20px]">Exact address</CardTitle>
        <CardDescription>{unlock.contactInfo.address}</CardDescription>
      </Card>
      <Card>
        <CardTitle className="text-[20px]">Directions</CardTitle>
        <CardDescription>{listing.directions}</CardDescription>
      </Card>
      {latitude !== undefined && longitude !== undefined ? (
        <>
          <Card>
            <CardTitle className="text-[20px]">Exact GPS location</CardTitle>
            <CardDescription>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </CardDescription>
          </Card>
          <View className="overflow-hidden rounded-[32px] border border-border">
            <RevealedLocationMap
              address={unlock.contactInfo.address}
              latitude={latitude}
              longitude={longitude}
              title={listing.title}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

export function ConfirmationSuccessScreen() {
  const { latestUnlock, getListingById } = useMobileApp();
  const listing = getListingById(latestUnlock?.listingId);

  return (
    <Screen>
      <SectionHeader
        kicker="Both confirmed"
        title="Connection complete"
        description="Both sides confirmed the move. This unlock can now proceed into the commission hold window."
      />

      <Card>
        <CardTitle className="text-[20px]">{listing?.title ?? 'Latest unlock'}</CardTitle>
        <CardDescription>
          Hold window: {latestUnlock?.holdUntil ?? '7 days after confirmation'}.
        </CardDescription>
      </Card>

      <View className="gap-3">
        <Link href={appRoutes.rateReview} asChild>
          <Button label="Rate the experience" />
        </Link>
      </View>
    </Screen>
  );
}

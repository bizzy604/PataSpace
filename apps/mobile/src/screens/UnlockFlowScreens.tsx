/**
 * Purpose: Post-unlock flow: revealed (or masked) contact details, the
 * report-dead path, and the confirmed move-in success screen with fee
 * settlement plus the vacated-listing flywheel prompt.
 * Why important: this is where the trust promises become visible: masked
 * lines, instant refunds, fee-settled handover, and the supply flywheel.
 * Used by: /contact-revealed and /confirmation-success routes.
 */
import { useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RevealedLocationMap } from '@/components/map/revealed-location-map';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, reportDeadHref } from '@/lib/routes';

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
          <Link href={reportDeadHref(listing.id)} asChild>
            <Button variant="outline" label="House occupied or fake? Get refunded" />
          </Link>
          <Link
            href={{ pathname: appRoutes.dispute, params: { unlockId: unlock.id } }}
            asChild
          >
            <Button variant="outline" label="Report another issue" />
          </Link>
        </View>
      }
    >
      <SectionHeader
        kicker="Contact revealed"
        title={listing.title}
        description="A valid unlock now exposes the outgoing tenant contact details, exact directions, and precise GPS."
      />

      <Card>
        <View className="flex-row items-center justify-between">
          <CardTitle className="text-[20px]">Phone number</CardTitle>
          {unlock.contactMode === 'masked' ? <Badge variant="secondary">PataSpace line</Badge> : null}
        </View>
        <CardDescription>{unlock.contactInfo.phoneNumber}</CardDescription>
        {unlock.contactMode === 'masked' ? (
          <Text className="mt-2 text-xs text-muted-foreground">
            Calls route through PataSpace so both numbers stay private.
            {unlock.contactExpiresAt
              ? ` Line open until ${new Date(unlock.contactExpiresAt).toLocaleDateString('en-KE', {
                  month: 'short',
                  day: 'numeric',
                })}.`
              : ''}
          </Text>
        ) : null}
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
  const { latestUnlock, getListingById, settleFee, startSeededListing } = useMobileApp();
  const router = useRouter();
  const [settling, setSettling] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const listing = getListingById(latestUnlock?.listingId);
  const successFee = latestUnlock?.successFee;
  const prompt = latestUnlock?.vacatedListingPrompt;
  const feeSettled = !successFee || successFee.remainingKes === 0;

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

      {successFee ? (
        <Card>
          <View className="flex-row items-center justify-between">
            <CardTitle className="text-[20px]">Move-in fee</CardTitle>
            <Badge variant={feeSettled ? 'dark' : 'secondary'}>
              {feeSettled ? 'Settled' : 'Balance due'}
            </Badge>
          </View>
          <CardDescription>
            KES {successFee.feeDueKes.toLocaleString()} total. Your{' '}
            {successFee.creditsApplied.toLocaleString()} unlock credits already count toward it.
          </CardDescription>
          {!feeSettled ? (
            <View className="mt-4 gap-3">
              <Text className="text-lg font-semibold text-foreground">
                KES {successFee.remainingKes.toLocaleString()} remaining
              </Text>
              <Button
                label={settling ? 'Settling…' : 'Settle from credits'}
                disabled={settling}
                onPress={() => {
                  setFeedback(null);
                  setSettling(true);
                  void (latestUnlock
                    ? settleFee(latestUnlock.listingId)
                    : Promise.resolve('error' as const)
                  )
                    .then((result) => {
                      if (result === 'insufficient') {
                        setFeedback(
                          `Top up KES ${successFee.remainingKes.toLocaleString()} in credits first, then settle.`,
                        );
                        router.push(appRoutes.buyCredits);
                      } else if (result === 'error') {
                        setFeedback('Could not settle the fee. Try again.');
                      }
                    })
                    .finally(() => setSettling(false));
                }}
              />
              <Text className="text-xs text-muted-foreground">
                Settling before key handover keeps your account active and pays the person who
                found you this house.
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {prompt ? (
        <Card>
          <CardTitle className="text-[20px]">Leaving a house behind?</CardTitle>
          <CardDescription>{prompt.message}</CardDescription>
          <View className="mt-4">
            <Button
              label={seeding ? 'Preparing draft…' : 'Post it in 2 minutes'}
              disabled={seeding}
              onPress={() => {
                setFeedback(null);
                setSeeding(true);
                void startSeededListing(prompt.seededFromConfirmationId)
                  .then((result) => {
                    if (result === 'ready') {
                      router.push(appRoutes.createListing);
                    } else if (result === 'already_posted') {
                      setFeedback('You already posted this one. Check My listings.');
                    } else {
                      setFeedback('Could not prepare the draft. Try again.');
                    }
                  })
                  .finally(() => setSeeding(false));
              }}
            />
          </View>
        </Card>
      ) : null}

      {feedback ? <Text className="text-sm text-destructive">{feedback}</Text> : null}

      <View className="gap-3">
        <Link href={appRoutes.rateReview} asChild>
          <Button variant="secondary" label="Rate the experience" />
        </Link>
      </View>
    </Screen>
  );
}

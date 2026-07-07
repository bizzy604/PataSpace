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
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RevealedLocationMap } from '@/components/map/revealed-location-map';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, listingHref, reportDeadHref } from '@/lib/routes';

/** Digits-only phone for tel:/wa.me links (wa.me wants no + or spaces). */
function dialDigits(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return 'PS';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[1][0] ?? '' : '';
  return (first + second).toUpperCase();
}

function ContactRow({
  icon,
  iconTint,
  iconColor,
  label,
  value,
  action,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  iconTint: string;
  iconColor: string;
  label: string;
  value: string;
  action?: { icon: React.ComponentProps<typeof AppIcon>['name']; onPress: () => void; accessibilityLabel: string };
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-4">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: iconTint }}
      >
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-body text-label-md text-muted-foreground">{label}</Text>
        <Text className="font-body-medium text-body-lg text-foreground">{value}</Text>
      </View>
      {action ? (
        <Pressable
          className="h-9 w-9 items-center justify-center active:opacity-60"
          onPress={action.onPress}
          accessibilityLabel={action.accessibilityLabel}
        >
          <AppIcon name={action.icon} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

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
      <Screen header={<ScreenHeader title="Contact Information" />}>
        <Card>
          <CardTitle>No unlocked contact yet</CardTitle>
          <CardDescription>Unlock a listing first to reveal the outgoing tenant contact details.</CardDescription>
        </Card>
        <Link href={appRoutes.search} asChild>
          <Button label="Browse listings" />
        </Link>
      </Screen>
    );
  }

  const phone = unlock.contactInfo.phoneNumber;
  const phoneLabel = phone ?? 'Shared after connection';
  const dial = phone ? dialDigits(phone) : '';
  const tenantName = listing.quoteAuthor?.split(',')[0]?.trim() || 'Outgoing Tenant';
  const mapsUrl =
    latitude !== undefined && longitude !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unlock.contactInfo.address)}`;

  return (
    <Screen
      header={<ScreenHeader title="Contact Information" />}
      bottomBar={
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            shape="pill"
            label="Call Now"
            disabled={!dial}
            onPress={() => void Linking.openURL(`tel:${dial}`)}
          />
          <Button
            className="flex-1"
            shape="pill"
            variant="secondary"
            label="WhatsApp"
            disabled={!dial}
            onPress={() => void Linking.openURL(`https://wa.me/${dial}`)}
          />
        </View>
      }
    >
      <View className="flex-row items-center gap-3 rounded-[16px] bg-success/10 p-4">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-success">
          <AppIcon name="checkmark" size={18} inverse />
        </View>
        <Text className="font-body-medium text-body-lg text-success">Contact Unlocked!</Text>
      </View>

      <View className="items-center gap-3 rounded-[16px] bg-card p-6 shadow-card">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <Text className="font-display text-headline-md text-primary">{initialsFrom(tenantName)}</Text>
        </View>
        <View className="items-center gap-1">
          <Text className="font-display text-headline-sm text-foreground">{tenantName}</Text>
          <Text className="font-body text-body-md text-muted-foreground">Current Tenant</Text>
        </View>
        <View className="flex-row items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <View className="h-2 w-2 rounded-full bg-success" />
          <Text className="font-body text-label-md text-muted-foreground">Active on PataSpace</Text>
        </View>
      </View>

      <View className="rounded-[16px] bg-card shadow-card">
        <ContactRow
          icon="call"
          iconTint="rgba(0,102,126,0.12)"
          iconColor="#00667E"
          label="Phone Number"
          value={phoneLabel}
          action={
            dial
              ? {
                  icon: 'call',
                  accessibilityLabel: 'Call tenant',
                  onPress: () => void Linking.openURL(`tel:${dial}`),
                }
              : undefined
          }
        />
        <ContactRow
          icon="logo-whatsapp"
          iconTint="rgba(52,199,89,0.15)"
          iconColor="#25D366"
          label="WhatsApp"
          value={phoneLabel}
          action={
            dial
              ? {
                  icon: 'logo-whatsapp',
                  accessibilityLabel: 'Message on WhatsApp',
                  onPress: () => void Linking.openURL(`https://wa.me/${dial}`),
                }
              : undefined
          }
        />
        <View className="gap-2 px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-subtle">
              <AppIcon name="location" size={20} active />
            </View>
            <View className="flex-1">
              <Text className="font-body text-label-md text-muted-foreground">Property Location</Text>
              <Text className="font-body-medium text-body-lg text-foreground">
                {unlock.contactInfo.address}
              </Text>
              <Pressable
                className="mt-2 flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => void Linking.openURL(mapsUrl)}
              >
                <AppIcon name="map-outline" size={16} active />
                <Text className="font-body-medium text-body-md text-primary">Open in Maps</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {unlock.contactMode === 'masked' ? (
        <View className="flex-row items-start gap-2 rounded-[16px] bg-primary/5 p-4">
          <AppIcon name="shield-checkmark" size={18} active />
          <Text className="flex-1 font-body text-body-md text-muted-foreground">
            Calls route through PataSpace so both numbers stay private.
            {unlock.contactExpiresAt
              ? ` Line open until ${new Date(unlock.contactExpiresAt).toLocaleDateString('en-KE', {
                  month: 'short',
                  day: 'numeric',
                })}.`
              : ''}
          </Text>
        </View>
      ) : null}

      {latitude !== undefined && longitude !== undefined ? (
        <View className="overflow-hidden rounded-[16px] border border-border">
          <RevealedLocationMap
            address={unlock.contactInfo.address}
            latitude={latitude}
            longitude={longitude}
            title={listing.title}
          />
        </View>
      ) : null}

      <Text className="font-display text-headline-sm text-foreground">Connection Status</Text>
      <View className="gap-0">
        <View className="flex-row gap-3">
          <View className="items-center">
            <View className="h-3 w-3 rounded-full bg-success" />
            <View className="w-px flex-1 bg-border" />
          </View>
          <View className="flex-1 pb-5">
            <Text className="font-body-medium text-body-lg text-foreground">Contact Unlocked</Text>
            <Text className="font-body text-label-md text-muted-foreground">Just now</Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="items-center">
            <View
              className={`h-3 w-3 rounded-full ${unlock.incomingConfirmed ? 'bg-success' : 'bg-outline-variant'}`}
            />
          </View>
          <View className="flex-1">
            <Text
              className={
                unlock.incomingConfirmed
                  ? 'font-body-medium text-body-lg text-foreground'
                  : 'font-body-medium text-body-lg text-muted-foreground'
              }
            >
              Confirm Connection
            </Text>
            <Text className="font-body text-label-md text-muted-foreground">
              {unlock.incomingConfirmed ? 'Confirmation recorded' : 'Pending tenant verification'}
            </Text>
          </View>
        </View>
      </View>

      <Button
        label={unlock.incomingConfirmed ? 'Confirmation recorded' : "I've contacted this tenant"}
        disabled={unlock.incomingConfirmed}
        onPress={() => {
          confirmIncoming(listing.id);
          router.push(appRoutes.confirmations);
        }}
      />
      <View className="flex-row gap-3">
        <Link href={reportDeadHref(listing.id)} asChild>
          <Button className="flex-1" variant="outline" label="Occupied or fake?" />
        </Link>
        <Link href={{ pathname: appRoutes.dispute, params: { unlockId: unlock.id } }} asChild>
          <Button className="flex-1" variant="outline" label="Report issue" />
        </Link>
      </View>
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
  const address = latestUnlock?.contactInfo.address ?? listing?.location;

  return (
    <Screen
      bottomBar={
        <View className="gap-1">
          {listing ? (
            <Link href={listingHref(listing.id)} asChild>
              <Button shape="pill" variant="outline" label="View Property Details" />
            </Link>
          ) : null}
          <Pressable
            className="items-center py-3 active:opacity-70"
            onPress={() => router.replace(appRoutes.home)}
          >
            <Text className="font-body-medium text-body-md text-muted-foreground">Done</Text>
          </Pressable>
        </View>
      }
    >
      <View className="flex-row justify-end">
        <Pressable
          className="h-10 w-10 items-center justify-center active:opacity-70"
          onPress={() => router.replace(appRoutes.home)}
          accessibilityLabel="Close"
        >
          <AppIcon name="close" size={26} active />
        </Pressable>
      </View>

      <View className="items-center gap-4">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <AppIcon name="git-compare-outline" size={44} active />
        </View>
        <Text className="text-center font-display text-display-02 text-primary">
          Connection Confirmed!
        </Text>
        <Text className="px-6 text-center font-body text-body-lg text-muted-foreground">
          Both parties have confirmed. Enjoy your new home!
        </Text>
      </View>

      {listing ? (
        <View className="flex-row items-center gap-3 rounded-[16px] bg-card p-4 shadow-card">
          <Image className="h-16 w-16 rounded-[12px] bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
          <View className="flex-1">
            <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
              Revealed Address
            </Text>
            <Text className="font-display text-headline-sm text-foreground">{address}</Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <AppIcon name="calendar-outline" size={14} />
              <Text className="font-body text-label-md text-muted-foreground">
                Move-in: {listing.availableFrom}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {successFee ? (
        <View className="gap-3 rounded-[16px] border-l-4 border-primary bg-card p-4 shadow-card">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <AppIcon name="cash-outline" size={20} active />
              <Text className="font-display text-body-lg text-foreground">Move-in Settlement</Text>
            </View>
            <Badge variant={feeSettled ? 'success' : 'warning'}>
              {feeSettled ? 'Settled' : 'Balance due'}
            </Badge>
          </View>
          <Text className="font-body text-body-md text-muted-foreground">
            KES {successFee.feeDueKes.toLocaleString()} total ·{' '}
            {successFee.creditsApplied.toLocaleString()} unlock credits applied. Hold window ends{' '}
            {latestUnlock?.holdUntil ?? '7 days after confirmation'}.
          </Text>
          {!feeSettled ? (
            <Button
              size="sm"
              label={settling ? 'Settling…' : `Settle KES ${successFee.remainingKes.toLocaleString()} from credits`}
              disabled={settling}
              onPress={() => {
                setFeedback(null);
                setSettling(true);
                void (latestUnlock ? settleFee(latestUnlock.listingId) : Promise.resolve('error' as const))
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
          ) : null}
        </View>
      ) : null}

      {prompt ? (
        <View className="gap-2 rounded-[16px] bg-primary/10 p-4">
          <Text className="font-display text-body-lg text-foreground">Leaving a house behind?</Text>
          <Text className="font-body text-body-md text-muted-foreground">{prompt.message}</Text>
          <Button
            className="mt-1 self-start"
            size="sm"
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
      ) : null}

      <View className="items-center gap-3 rounded-[16px] bg-primary/5 p-5">
        <Text className="font-display text-headline-sm text-foreground">How was your experience?</Text>
        <Link href={appRoutes.rateReview} asChild>
          <Pressable className="flex-row gap-1 active:opacity-70">
            {[1, 2, 3, 4, 5].map((star) => (
              <AppIcon key={star} name="star-outline" size={30} color="#8D9192" />
            ))}
          </Pressable>
        </Link>
        <Link href={appRoutes.rateReview} asChild>
          <Button size="sm" variant="outline" label="Leave Review" />
        </Link>
      </View>

      {feedback ? <Text className="font-body text-body-md text-danger">{feedback}</Text> : null}
    </Screen>
  );
}

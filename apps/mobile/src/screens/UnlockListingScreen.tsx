/**
 * Purpose: Pre-unlock confirmation sheet — the full cost picture (unlock cost,
 *   the ≈% of monthly rent, and the balance left after) plus the "what you'll
 *   get" checklist and the auto-refund promise, before charging. Matches
 *   Main Flow 1-5/unlock_confirmation_sheet. A shortfall opens the
 *   insufficient_credits_modal (main flow 21/insufficient_credits_modal).
 * Why important: The seeker must be able to decide before paying, or the
 *   paywall reads as a scam (spec 4.1). The unlock economics and every branch
 *   of the charge path stay exactly as wired.
 * Used by: /unlock route.
 */
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import {
  balanceAfterUnlock,
  canAffordUnlock,
  unlockRentPercent,
} from '@/lib/payments/unlock-summary';
import { appRoutes, contactRevealedHref } from '@/lib/routes';

const UNLOCK_BENEFITS = [
  "Tenant's phone number",
  'Full address',
  'GPS coordinates',
  'Direct WhatsApp contact',
];

export function UnlockListingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, walletBalance, unlockListing, isListingUnlocked } = useMobileApp();
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle>Listing not found</CardTitle>
          <CardDescription>That unlock target no longer exists.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const alreadyUnlocked = isListingUnlocked(listing.id);
  const hasEnoughCredits = canAffordUnlock(walletBalance, listing.unlockCostCredits);
  const balanceAfter = balanceAfterUnlock(walletBalance, listing.unlockCostCredits);
  const rentPercent = unlockRentPercent(listing.unlockCostCredits, listing.monthlyRent);

  async function handleUnlock() {
    if (!listing) return;

    if (alreadyUnlocked) {
      router.push(contactRevealedHref(listing.id));
      return;
    }

    if (!hasEnoughCredits) {
      setShowInsufficient(true);
      return;
    }

    const result = await unlockListing(listing.id);

    if (result === 'success' || result === 'already_unlocked') {
      router.push(contactRevealedHref(listing.id));
      return;
    }

    if (result === 'fee_unsettled') {
      setFeedback(
        'Settle the move-in fee from your last confirmed house before unlocking new listings.',
      );
      router.push(appRoutes.confirmations);
      return;
    }

    if (result === 'insufficient') {
      setShowInsufficient(true);
      return;
    }

    setFeedback('Unlock failed. Check your balance and try again.');
  }

  return (
    <Screen
      bottomBar={
        <View className="gap-1">
          <Button
            shape="pill"
            label={alreadyUnlocked ? 'Open Contact' : `Unlock for ${listing.unlockCost}`}
            onPress={handleUnlock}
          />
          {feedback ? (
            <Text className="px-2 pt-1 font-body text-label-md text-danger">{feedback}</Text>
          ) : null}
          <Pressable
            className="items-center py-3 active:opacity-70"
            onPress={() => router.back()}
          >
            <Text className="font-body-medium text-body-md text-muted-foreground">Cancel</Text>
          </Pressable>
        </View>
      }
    >
      <View className="items-center gap-4 pt-2">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <AppIcon name="lock-closed" size={32} active />
        </View>
        <Text className="px-6 text-center font-display text-headline-lg text-foreground">
          Unlock Contact Information?
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-[16px] bg-surface-subtle p-3">
        <Image
          className="h-16 w-16 rounded-[12px] bg-surface-subtle"
          resizeMode="cover"
          source={listing.coverImage}
        />
        <View className="flex-1">
          <Text className="font-body-medium text-body-lg text-foreground">{listing.title}</Text>
          <Text className="mt-0.5 font-body text-body-md text-muted-foreground">
            {listing.price} • {listing.area}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-display text-headline-sm text-foreground">Unlock Cost</Text>
          <Text className="font-display text-headline-sm text-foreground">{listing.unlockCost}</Text>
        </View>
        {rentPercent !== null ? (
          <Text className="text-right font-body text-body-md text-muted-foreground">
            ≈ {rentPercent}% of monthly rent
          </Text>
        ) : null}
        <View className="h-px bg-border" />
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-body-lg text-muted-foreground">New Balance</Text>
          <Text className="font-body-medium text-body-lg text-muted-foreground">
            {balanceAfter.toLocaleString()} credits
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          What you'll get
        </Text>
        {UNLOCK_BENEFITS.map((benefit) => (
          <View key={benefit} className="flex-row items-center gap-3">
            <AppIcon name="checkmark-circle" size={20} color="#34C759" />
            <Text className="font-body text-body-lg text-foreground">{benefit}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-start gap-3 rounded-[16px] bg-warning/15 p-4">
        <AppIcon name="information-circle" size={20} color="#B8860B" />
        <Text className="flex-1 font-body text-body-md text-on-warning">
          Full refund if the landlord rejects your application. Occupied or fake listings
          auto-refund with no repeat charge.
        </Text>
      </View>

      <View className="gap-1 rounded-[16px] border border-border p-4">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
          Only if you move in
        </Text>
        <Text className="font-display text-headline-sm text-foreground">
          KES {listing.successFeeKes.toLocaleString()} success fee
        </Text>
        <Text className="font-body text-body-md text-muted-foreground">
          Your {listing.unlockCost} unlock counts toward this fee at move-in, so unlocking is
          basically free for the person who takes the house.
        </Text>
      </View>

      <Dialog
        visible={showInsufficient}
        onClose={() => setShowInsufficient(false)}
        icon="wallet"
        title="Insufficient Credits"
        message={
          <Text className="text-center font-body text-body-md text-muted-foreground">
            You need{' '}
            <Text className="font-body-bold text-foreground">{listing.unlockCost}</Text> to unlock
            this contact. Your current balance is{' '}
            <Text className="font-body-bold text-foreground">
              {walletBalance.toLocaleString()} credits
            </Text>
            .
          </Text>
        }
        confirm={{
          label: 'Top Up Wallet',
          onPress: () => {
            setShowInsufficient(false);
            router.push(appRoutes.buyCredits);
          },
        }}
        cancel={{
          label: 'Maybe Later',
          variant: 'ghost',
          onPress: () => setShowInsufficient(false),
        }}
      />
    </Screen>
  );
}

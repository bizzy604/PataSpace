import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, contactRevealedHref } from '@/lib/routes';

export function UnlockListingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, walletBalance, unlockListing, isListingUnlocked } = useMobileApp();
  const router = useRouter();
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Listing not found</CardTitle>
          <CardDescription>That unlock target no longer exists.</CardDescription>
        </Card>
      </Screen>
    );
  }

  const alreadyUnlocked = isListingUnlocked(listing.id);
  const hasEnoughCredits = walletBalance >= listing.unlockCostCredits;
  const balanceAfterUnlock = Math.max(0, walletBalance - listing.unlockCostCredits);

  return (
    <Screen
      bottomBar={
        <View className="gap-3">
          <Button
            label={
              alreadyUnlocked
                ? 'Open revealed contact'
                : hasEnoughCredits
                  ? `Unlock for ${listing.unlockCost}`
                  : 'Top up credits first'
            }
            onPress={() => {
              if (alreadyUnlocked) {
                router.push(contactRevealedHref(listing.id));
                return;
              }

              if (!hasEnoughCredits) {
                router.push(appRoutes.buyCredits);
                return;
              }

              const result = unlockListing(listing.id);

              if (result === 'success' || result === 'already_unlocked') {
                router.push(contactRevealedHref(listing.id));
              }
            }}
          />
          <Link href={appRoutes.credits} asChild>
            <Button variant="outline" label="Open wallet" />
          </Link>
        </View>
      }
    >
      <SectionHeader
        kicker="Unlock flow"
        title="Review unlock"
        description="Cost and contact reveal"
      />

      <Card>
        <Badge variant="secondary">{listing.area}</Badge>
        <CardTitle className="mt-4 text-[22px]">{listing.title}</CardTitle>
        <CardDescription>Phone, address, and directions unlock instantly.</CardDescription>
      </Card>

      <View className="gap-3">
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Credits required</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">
            {listing.unlockCost}
          </Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Current balance</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">
            {walletBalance.toLocaleString()} credits
          </Text>
        </Card>
        <Card className="p-5">
          <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">Balance after unlock</Text>
          <Text className="mt-2 text-2xl font-semibold tracking-[-0.5px] text-foreground">
            {balanceAfterUnlock.toLocaleString()} credits
          </Text>
        </Card>
      </View>

      <Card>
        <CardTitle className="text-xl">What you reveal</CardTitle>
        <CardDescription>Phone, address, directions, move date.</CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-xl">Protection built in</CardTitle>
        <CardDescription>No repeat charge. Both sides confirm later.</CardDescription>
      </Card>
    </Screen>
  );
}

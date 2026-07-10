/**
 * Purpose: Post-a-listing flow entry ("no design", by analogy) — a short intro
 *   to the guided capture flow with a Start CTA into the camera step.
 * Why important: The supply-side on-ramp; restyled onto the redesign kit with
 *   the same routing (camera flow + listing dashboard).
 * Used by: app/create-listing.tsx.
 */
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { createListingSteps } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { appRoutes } from '@/lib/routes';

export function CreateListingScreen() {
  return (
    <Screen
      withTabBar
      bottomBar={
        <View className="gap-3">
          <Link href={appRoutes.createListingPhotos} asChild>
            <Button shape="pill" label="Start — take photos" />
          </Link>
          <Link href={appRoutes.myListings} asChild>
            <Button shape="pill" variant="outline" label="View my listings" />
          </Link>
        </View>
      }
    >
      <Text className="font-display text-display-02 text-foreground">Post a Listing</Text>

      <View className="gap-2 rounded-[16px] bg-primary p-6">
        <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-white/70">
          Turn your move-out into income
        </Text>
        <Text className="font-display text-headline-md text-white">
          Build a listing renters can trust
        </Text>
        <Text className="font-body text-body-md text-white/80">
          Capture once, verify with GPS, and earn a commission when an incoming tenant confirms the
          move.
        </Text>
      </View>

      <Text className="font-display text-headline-sm text-foreground">How it works</Text>
      <View className="rounded-[16px] bg-card p-5 shadow-card">
        {createListingSteps.map((item, index) => (
          <View key={item.step} className="flex-row gap-3">
            <View className="items-center">
              <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-primary">
                <Text className="font-display text-label-md text-primary">{item.step}</Text>
              </View>
              {index < createListingSteps.length - 1 ? (
                <View className="my-1 w-px flex-1 bg-border" />
              ) : null}
            </View>
            <View className="flex-1 pb-5">
              <Text className="font-body-medium text-body-lg text-foreground">{item.title}</Text>
              <Text className="font-body text-body-md text-muted-foreground">{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="flex-row items-start gap-3 rounded-[16px] bg-surface-subtle p-4">
        <AppIcon name="shield-checkmark" size={20} color="#34C759" />
        <Text className="flex-1 font-body text-body-md text-muted-foreground">
          You need at least 5 room photos with GPS, rent and deposit, and a landlord contact before
          publishing. The guided flow checks each one.
        </Text>
      </View>
    </Screen>
  );
}

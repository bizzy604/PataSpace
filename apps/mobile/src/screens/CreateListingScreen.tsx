import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { createListingSteps } from '@/data/mock-listings';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';

export function CreateListingScreen() {
  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Outgoing tenant flow"
        title="Create listing"
        description="Capture once, verify once, and publish a listing that incoming tenants can trust before they spend credits."
      />

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/70">
          Listing prep
        </Text>
        <Text className="mt-2 text-[26px] font-semibold tracking-[-0.6px] text-white">
          Build a listing renters can trust.
        </Text>
        <Text className="mt-2 text-sm leading-6 text-white/70">
          The guided flow keeps photos, GPS evidence, rent terms, and move-out context in one place.
        </Text>
      </View>

      <View className="gap-3">
        {createListingSteps.map((item) => (
          <Card key={item.step}>
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-tertiary-foreground">
              Step {item.step}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">{item.title}</Text>
            <CardDescription className="mt-2">{item.detail}</CardDescription>
          </Card>
        ))}
      </View>

      <Card>
        <CardTitle>What gets built next</CardTitle>
        <CardDescription>
          Camera capture, photo review, property details, and review-submit screens will plug into this shell next.
        </CardDescription>
        <View className="mt-4 gap-3 rounded-[20px] bg-secondary p-4">
          <Text className="text-sm font-semibold text-foreground">Current checklist</Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            Minimum 8 room photos, GPS evidence attached, rent and deposit entered, and landlord contact confirmed.
          </Text>
        </View>
      </Card>

      <Link href="/my-listings" asChild>
        <Button label="Open listing dashboard" />
      </Link>
    </Screen>
  );
}

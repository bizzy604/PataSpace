import { Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

export function ConfirmationsScreen() {
  const { latestUnlock, getListingById, confirmationStages, confirmIncoming, confirmOutgoing } =
    useMobileApp();
  const router = useRouter();
  const listing = getListingById(latestUnlock?.listingId);

  if (!latestUnlock || !listing) {
    return (
      <Screen withTabBar>
        <SectionHeader
          kicker="Confirmation flow"
          title="No unlock to confirm yet"
          description="Unlock a listing first, then both sides can record the connection here."
        />
        <Link href={appRoutes.search} asChild>
          <Button label="Browse listings" />
        </Link>
      </Screen>
    );
  }

  const completedSteps =
    Number(latestUnlock.incomingConfirmed) + Number(latestUnlock.outgoingConfirmed);
  const progressWidth = completedSteps === 0 ? '33%' : completedSteps === 1 ? '66%' : '100%';
  const bothConfirmed = latestUnlock.incomingConfirmed && latestUnlock.outgoingConfirmed;

  return (
    <Screen withTabBar>
      <SectionHeader
        kicker="Confirmation flow"
        title="Confirm the connection"
        description="Both sides confirm after contact is made, and that unlock then moves toward commission payout."
      />

      <View className="rounded-[28px] bg-surface-inverse p-6 shadow-floating">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/70">
          Current unlock
        </Text>
        <Text className="mt-2 text-[26px] font-semibold tracking-[-0.6px] text-white">
          {listing.title}
        </Text>
        <Text className="mt-2 text-sm leading-6 text-white/70">
          {bothConfirmed
            ? 'Both confirmations are complete. The commission hold window can now begin.'
            : 'Record both sides of the connection so the unlock can move into commission hold.'}
        </Text>
        <View className="mt-4 h-2 rounded-full bg-white/15">
          <View className="h-2 rounded-full bg-primary" style={{ width: progressWidth }} />
        </View>
      </View>

      <Card>
        <View className="flex-row flex-wrap gap-3">
          <Badge variant={latestUnlock.incomingConfirmed ? 'dark' : 'secondary'}>
            Incoming {latestUnlock.incomingConfirmed ? 'confirmed' : 'pending'}
          </Badge>
          <Badge variant={latestUnlock.outgoingConfirmed ? 'dark' : 'secondary'}>
            Outgoing {latestUnlock.outgoingConfirmed ? 'confirmed' : 'pending'}
          </Badge>
        </View>
        <CardTitle className="mt-4">Current unlock status</CardTitle>
        <CardDescription>
          The latest unlocked listing is {listing.title}. Once both confirmations are recorded, commission enters a seven-day hold window.
        </CardDescription>
      </Card>

      <View className="gap-3">
        {confirmationStages.map((stage) => (
          <Card key={stage.step} className="p-5">
            <Text className="text-xs uppercase tracking-[1.8px] text-tertiary-foreground">
              Step {stage.step}
            </Text>
            <Text className="mt-2 text-lg font-semibold text-foreground">{stage.title}</Text>
            <CardDescription className="mt-2">{stage.detail}</CardDescription>
          </Card>
        ))}
      </View>

      <View className="gap-3">
        <Button
          label={latestUnlock.incomingConfirmed ? 'Incoming side already confirmed' : 'Confirm incoming tenant side'}
          disabled={latestUnlock.incomingConfirmed}
          onPress={() => confirmIncoming(listing.id)}
        />
        <Button
          variant="outline"
          label={latestUnlock.outgoingConfirmed ? 'Outgoing side already confirmed' : 'Confirm outgoing tenant side'}
          disabled={latestUnlock.outgoingConfirmed}
          onPress={() => confirmOutgoing(listing.id)}
        />
        {bothConfirmed ? (
          <Button
            variant="dark"
            label="View success screen"
            onPress={() => router.push(appRoutes.confirmationSuccess)}
          />
        ) : null}
      </View>

      <Link href={appRoutes.myListings} asChild>
        <Button variant="secondary" label="View listing dashboard" />
      </Link>
    </Screen>
  );
}

/**
 * Purpose: Incoming-tenant confirmation — the "Are you moving in?" checklist
 *   (confirm_connection) before confirming, then the connection-status timeline
 *   (connection_status_tracking) once confirmed, tracking both sides toward the
 *   commission window.
 * Why important: This is where the incoming tenant records the move-in that
 *   moves an unlock toward payout; the confirm action stays exactly as wired.
 * Used by: app/confirmations.tsx.
 */
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes, reportDeadHref } from '@/lib/routes';

const CONFIRM_CHECKS = [
  { key: 'viewed', title: "I've viewed the property", detail: 'In person or via virtual tour.' },
  { key: 'approved', title: "I've been approved by the landlord", detail: 'You have explicit permission to occupy.' },
  { key: 'moving', title: "I'm moving in within 30 days", detail: 'Or have already moved in.' },
] as const;

type TimelineStep = {
  title: string;
  detail: string;
  state: 'done' | 'active' | 'pending';
};

function TimelineRow({ step, last, children }: { step: TimelineStep; last?: boolean; children?: React.ReactNode }) {
  const dotColor =
    step.state === 'done' ? 'bg-success' : step.state === 'active' ? 'bg-primary' : 'bg-outline-variant';

  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View className={`h-7 w-7 items-center justify-center rounded-full ${dotColor}`}>
          {step.state === 'done' ? (
            <AppIcon name="checkmark" size={16} inverse />
          ) : step.state === 'pending' ? (
            <AppIcon name="cash-outline" size={14} color="#8D9192" />
          ) : null}
        </View>
        {!last ? <View className="mt-1 w-px flex-1 bg-border" /> : null}
      </View>
      <View className="flex-1 pb-6">
        <Text
          className={
            step.state === 'active'
              ? 'font-display text-body-lg text-primary'
              : step.state === 'pending'
                ? 'font-body-medium text-body-lg text-muted-foreground'
                : 'font-body-medium text-body-lg text-foreground'
          }
        >
          {step.title}
        </Text>
        <Text className="font-body text-label-md text-muted-foreground">{step.detail}</Text>
        {children}
      </View>
    </View>
  );
}

export function ConfirmationsScreen() {
  const { latestUnlock, getListingById, confirmIncoming } = useMobileApp();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const listing = getListingById(latestUnlock?.listingId);

  if (!latestUnlock || !listing) {
    return (
      <Screen header={<ScreenHeader title="Confirm Connection" />}>
        <View className="items-center gap-3 py-16">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-subtle">
            <AppIcon name="key-outline" size={28} active />
          </View>
          <Text className="text-center font-display text-headline-sm text-foreground">
            No unlock to confirm yet
          </Text>
          <Text className="px-8 text-center font-body text-body-md text-muted-foreground">
            Unlock a listing first, then both sides can record the connection here.
          </Text>
          <Link href={appRoutes.search} asChild>
            <Button label="Browse listings" />
          </Link>
        </View>
      </Screen>
    );
  }

  const allChecked = CONFIRM_CHECKS.every((item) => checks[item.key]);
  const bothConfirmed = latestUnlock.incomingConfirmed && latestUnlock.outgoingConfirmed;
  const phone = latestUnlock.contactInfo.phoneNumber;
  const dial = phone ? phone.replace(/[^0-9]/g, '') : '';
  const tenantName = listing.quoteAuthor?.split(',')[0]?.trim() || 'Outgoing Tenant';

  // State 1 — the "Are you moving in?" checklist (before the tenant confirms).
  if (!latestUnlock.incomingConfirmed) {
    return (
      <Screen
        header={<ScreenHeader title="Confirm Connection" />}
        bottomBar={
          <Button
            shape="pill"
            disabled={!allChecked || submitting}
            label={submitting ? 'Recording…' : "Confirm I'm Moving In"}
            onPress={() => {
              setFeedback(null);
              setSubmitting(true);
              void confirmIncoming(listing.id)
                .then((result) => {
                  if (result === 'error') {
                    setFeedback('We could not record your confirmation. Try again.');
                  }
                })
                .finally(() => setSubmitting(false));
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <ProgressSteps className="flex-1" count={2} current={0} label="Your Confirmation" />
        </View>

        <View className="items-center gap-4 pt-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-subtle">
            <AppIcon name="key-outline" size={32} active />
          </View>
          <Text className="font-display text-headline-lg text-foreground">Are you moving in?</Text>
          <Text className="px-4 text-center font-body text-body-lg text-muted-foreground">
            Please confirm the following details to proceed with linking your account to this property.
          </Text>
        </View>

        <View className="rounded-[16px] bg-card shadow-card">
          {CONFIRM_CHECKS.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => setChecks((current) => ({ ...current, [item.key]: !current[item.key] }))}
              className={`flex-row items-start gap-3 px-4 py-4 ${index < CONFIRM_CHECKS.length - 1 ? 'border-b border-border' : ''}`}
            >
              <AppIcon
                name={checks[item.key] ? 'checkbox' : 'square-outline'}
                size={22}
                active={checks[item.key]}
              />
              <View className="flex-1">
                <Text className="font-body-medium text-body-lg text-foreground">{item.title}</Text>
                <Text className="font-body text-label-md text-muted-foreground">{item.detail}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-start gap-3 rounded-[16px] bg-warning/15 p-4">
          <AppIcon name="information-circle" size={20} color="#B8860B" />
          <View className="flex-1">
            <Text className="font-display text-body-md text-on-warning">Important Notice</Text>
            <Text className="mt-1 font-body text-body-md text-on-warning">
              False confirmations may result in account suspension and delayed processing for genuine
              tenants. Only proceed if you are the legitimate incoming tenant.
            </Text>
          </View>
        </View>

        {feedback ? (
          <Text className="font-body text-body-md text-danger">{feedback}</Text>
        ) : null}
      </Screen>
    );
  }

  // State 2 — the connection-status timeline (after the tenant confirms).
  const timeline: TimelineStep[] = [
    { title: 'Contact Unlocked', detail: 'You unlocked this listing', state: 'done' },
    { title: 'Property Viewed', detail: 'Automated confirmation', state: 'done' },
    { title: 'Your Confirmation', detail: 'You confirmed your move-in', state: 'done' },
    {
      title: 'Tenant Confirmation',
      detail: latestUnlock.outgoingConfirmed ? 'Outgoing tenant confirmed' : 'Waiting for the outgoing tenant',
      state: latestUnlock.outgoingConfirmed ? 'done' : 'active',
    },
    { title: 'Commission Payment', detail: '7 days after both confirmations', state: 'pending' },
  ];

  return (
    <Screen header={<ScreenHeader title="Connection Status" />}>
      <View className="flex-row items-center gap-3 rounded-[16px] bg-card p-3 shadow-card">
        <Image className="h-16 w-16 rounded-[12px] bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <AppIcon name="checkmark-circle" size={14} color="#34C759" />
            <Text className="font-body text-label-md text-success">Unlocked</Text>
          </View>
          <Text className="font-display text-headline-sm text-foreground">
            {listing.price}
          </Text>
          <View className="flex-row items-center gap-1">
            <AppIcon name="location-outline" size={13} active />
            <Text className="font-body text-body-md text-muted-foreground">{listing.location}</Text>
          </View>
        </View>
      </View>

      <View className="rounded-[16px] bg-card p-5 shadow-card">
        {timeline.map((step, index) => (
          <TimelineRow key={step.title} step={step} last={index === timeline.length - 1}>
            {step.state === 'active' && !latestUnlock.outgoingConfirmed ? (
              <View className="mt-3 gap-3 rounded-[12px] bg-surface-subtle p-4">
                <View className="flex-row items-center gap-2">
                  <AppIcon name="hourglass-outline" size={16} active />
                  <Text className="font-body-medium text-body-md text-foreground">
                    Waiting for outgoing tenant
                  </Text>
                </View>
                <Text className="font-body text-label-md text-muted-foreground">
                  Usually confirms within 3 days
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  label="Send Reminder"
                  disabled={!dial}
                  onPress={() => dial && void Linking.openURL(`https://wa.me/${dial}`)}
                />
              </View>
            ) : null}
          </TimelineRow>
        ))}
      </View>

      {bothConfirmed ? (
        <Button
          shape="pill"
          label="View confirmation summary"
          onPress={() => router.push(appRoutes.confirmationSuccess)}
        />
      ) : null}

      <View className="gap-3 rounded-[16px] bg-primary/10 p-4">
        <Text className="font-body-medium text-body-md text-foreground">Need to follow up?</Text>
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-card">
            <Text className="font-display text-body-md text-primary">
              {tenantName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-body-medium text-body-lg text-foreground">{tenantName}</Text>
            <Text className="font-body text-label-md text-muted-foreground">{phone ?? 'Shared after unlock'}</Text>
          </View>
          <Pressable
            disabled={!dial}
            onPress={() => dial && void Linking.openURL(`tel:${dial}`)}
            className="h-11 w-11 items-center justify-center rounded-full bg-card active:opacity-70"
            accessibilityLabel="Call tenant"
          >
            <AppIcon name="call" size={20} active />
          </Pressable>
          <Pressable
            disabled={!dial}
            onPress={() => dial && void Linking.openURL(`https://wa.me/${dial}`)}
            className="h-11 w-11 items-center justify-center rounded-full bg-success active:opacity-70"
            accessibilityLabel="Message on WhatsApp"
          >
            <AppIcon name="logo-whatsapp" size={20} inverse />
          </Pressable>
        </View>
      </View>

      <View className="gap-2 rounded-[16px] bg-card p-4 shadow-card">
        <Text className="font-body-medium text-body-lg text-foreground">Tenant not confirming?</Text>
        <View className="flex-row items-center gap-1.5">
          <AppIcon name="information-circle-outline" size={15} />
          <Text className="font-body text-label-md text-muted-foreground">
            Auto-confirmation runs after the hold window.
          </Text>
        </View>
        <Link href={reportDeadHref(listing.id)} asChild>
          <Pressable className="mt-1 flex-row items-center gap-1.5 active:opacity-70">
            <Text className="font-body-medium text-body-md text-danger">Report Issue</Text>
            <AppIcon name="arrow-forward" size={16} color="#FF3B30" />
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

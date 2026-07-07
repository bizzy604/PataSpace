/**
 * Purpose: Report-dead flow (spec section 4.2): the seeker picks a reason
 * code and gets their unlock credits refunded instantly.
 * Why important: automatic reason-coded refunds are the trust product;
 * landlord_declined is captured separately so the market signal stays clean.
 * Used by: /report-dead route (entered from the revealed-contact screen).
 */
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { UnlockDeadReason } from '@pataspace/contracts';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

const REASON_OPTIONS: Array<{ value: UnlockDeadReason; label: string; detail: string }> = [
  {
    value: UnlockDeadReason.OCCUPIED,
    label: 'Already occupied',
    detail: 'Someone else lives there or has taken the house.',
  },
  {
    value: UnlockDeadReason.FAKE,
    label: 'Listing is fake',
    detail: 'The house does not exist or does not match the photos.',
  },
  {
    value: UnlockDeadReason.UNRESPONSIVE,
    label: 'Poster unresponsive',
    detail: 'No reply to your calls or messages.',
  },
  {
    value: UnlockDeadReason.LANDLORD_DECLINED,
    label: 'Landlord declined',
    detail: 'The landlord or caretaker rejected the move-in.',
  },
];

export function ReportDeadScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { getListingById, reportDeadUnlock } = useMobileApp();
  const router = useRouter();
  const [reason, setReason] = useState<UnlockDeadReason | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [received, setReceived] = useState(false);
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen header={<ScreenHeader title="Report Issue" />}>
        <Card>
          <CardTitle>Unlock not found</CardTitle>
          <CardDescription>This unlock no longer exists or was already refunded.</CardDescription>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<ScreenHeader title="Report Issue" />}
      bottomBar={
        <Button
          shape="pill"
          label={submitting ? 'Refunding…' : 'Submit Report'}
          disabled={!reason || submitting}
          onPress={() => {
            if (!reason) return;
            setFeedback(null);
            setSubmitting(true);
            void reportDeadUnlock(listing.id, reason, comment.trim() || undefined)
              .then((result) => {
                if (result === 'refunded') {
                  setReceived(true);
                } else {
                  setFeedback('Could not process the refund. Try again.');
                }
              })
              .finally(() => setSubmitting(false));
          }}
        />
      }
    >
      <View className="flex-row items-center gap-3 rounded-[16px] bg-card p-3 shadow-card">
        <Image className="h-16 w-16 rounded-[12px] bg-surface-subtle" resizeMode="cover" source={listing.coverImage} />
        <View className="flex-1">
          <Text className="font-body-medium text-label-md uppercase tracking-[1px] text-muted-foreground">
            Listing Context
          </Text>
          <Text className="font-display text-headline-sm text-foreground">{listing.title}</Text>
          <Text className="font-body text-label-md text-muted-foreground">Ref: {listing.id}</Text>
        </View>
      </View>

      <Text className="font-body-bold text-label-md text-muted-foreground">What went wrong?</Text>
      <View className="gap-2">
        {REASON_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === option.value }}
            onPress={() => setReason(option.value)}
            className={
              reason === option.value
                ? 'flex-row items-start gap-3 rounded-[12px] border-2 border-primary bg-surface-subtle p-4'
                : 'flex-row items-start gap-3 rounded-[12px] border border-border bg-surface-subtle p-4'
            }
          >
            <AppIcon
              active={reason === option.value}
              name={reason === option.value ? 'radio-button-on' : 'radio-button-off'}
              size={22}
            />
            <View className="flex-1">
              <Text className="font-body-medium text-body-lg text-foreground">{option.label}</Text>
              <Text className="font-body text-label-md text-muted-foreground">{option.detail}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-body-bold text-label-md text-muted-foreground">Details</Text>
          <Text className="font-body text-label-md text-muted-foreground">{comment.length}/500</Text>
        </View>
        <Input
          className="min-h-28 py-4"
          value={comment}
          onChangeText={(value) => setComment(value.slice(0, 500))}
          placeholder="Please describe exactly what happened…"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="flex-row items-start gap-3 rounded-[16px] bg-primary/5 p-4">
        <AppIcon name="information-circle" size={20} active />
        <View className="flex-1">
          <Text className="font-display text-body-md text-primary">Instant refund</Text>
          <Text className="mt-1 font-body text-body-md text-muted-foreground">
            Reason-coded reports refund your unlock credits immediately. False reports violate our
            terms; our trust and safety team reviews all submissions.
          </Text>
        </View>
      </View>

      {feedback ? (
        <View className="flex-row items-center gap-2 rounded-[16px] bg-danger/10 p-4">
          <AppIcon name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{feedback}</Text>
        </View>
      ) : null}

      <Dialog
        visible={received}
        onClose={() => {
          setReceived(false);
          router.replace(appRoutes.credits);
        }}
        icon="checkmark-circle"
        title="Report Received"
        message="Your unlock credits have been refunded. Thank you for helping us keep PataSpace safe — our team will review your report within 24 hours."
        confirm={{
          label: 'Got it',
          variant: 'dark',
          onPress: () => {
            setReceived(false);
            router.replace(appRoutes.credits);
          },
        }}
      />
    </Screen>
  );
}

/**
 * Purpose: Report-dead flow (spec section 4.2): the seeker picks a reason
 * code and gets their unlock credits refunded instantly.
 * Why important: automatic reason-coded refunds are the trust product;
 * landlord_declined is captured separately so the market signal stays clean.
 * Used by: /report-dead route (entered from the revealed-contact screen).
 */
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { UnlockDeadReason } from '@pataspace/contracts';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
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
  const listing = getListingById(params.id);

  if (!listing) {
    return (
      <Screen>
        <Card>
          <CardTitle className="text-[20px]">Unlock not found</CardTitle>
          <CardDescription>This unlock no longer exists or was already refunded.</CardDescription>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      bottomBar={
        <Button
          label={
            submitting ? 'Refunding…' : reason ? 'Report and refund my credits' : 'Pick a reason'
          }
          disabled={!reason || submitting}
          onPress={() => {
            if (!reason) return;
            setFeedback(null);
            setSubmitting(true);
            void reportDeadUnlock(listing.id, reason, comment.trim() || undefined)
              .then((result) => {
                if (result === 'refunded') {
                  router.replace(appRoutes.credits);
                } else {
                  setFeedback('Could not process the refund. Try again.');
                }
              })
              .finally(() => setSubmitting(false));
          }}
        />
      }
    >
      <SectionHeader
        kicker="Report dead listing"
        title={listing.title}
        description="Tell us why this house did not work out. Your credits refund instantly."
      />

      <View className="gap-3">
        {REASON_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: reason === option.value }}
            onPress={() => setReason(option.value)}
          >
            <Card className={reason === option.value ? 'border border-primary' : ''}>
              <View className="flex-row items-center gap-3">
                <AppIcon
                  active={reason === option.value}
                  name={reason === option.value ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                />
                <View className="flex-1">
                  <CardTitle className="text-[16px]">{option.label}</CardTitle>
                  <CardDescription>{option.detail}</CardDescription>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card>
        <CardTitle className="text-[16px]">Anything else? (optional)</CardTitle>
        <Input
          className="mt-3"
          value={comment}
          onChangeText={setComment}
          placeholder="What happened?"
          multiline
        />
      </Card>

      {feedback ? <Text className="text-sm text-destructive">{feedback}</Text> : null}
    </Screen>
  );
}

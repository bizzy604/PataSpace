/**
 * Purpose: Final step of the post-a-listing flow: preview, earnings estimate,
 * accuracy attestation, phone-verification gate, and submission.
 * Why important: this is where the listing actually ships; submission is
 * blocked (client and server) until the poster's phone is verified, since
 * unlocks sell access to that number.
 * Used by: app/create-listing-review.tsx route.
 */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { estimateListingPricing } from '@/data/mock-listings';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  isPhoneVerificationError,
  phoneGateBlocksSubmit,
} from '@/features/account/phone-verification-gate';
import { PhoneVerificationCard } from '@/features/account/phone-verification-card';
import { usePhoneVerification } from '@/features/account/use-phone-verification';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { ApiRequestError } from '@/lib/api-client';
import { captureMoreLabel, hasEnoughPhotos } from '@/lib/listing-rules';
import { appRoutes } from '@/lib/routes';
import { ListingPreviewCard } from './listing-review/listing-preview-card';

export function ListingReviewScreen() {
  const { draft, submitDraft, updateDraft } = useMobileApp();
  const router = useRouter();
  const verification = usePhoneVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const monthlyRent = Number(draft.monthlyRent) || 0;
  const pricing = estimateListingPricing(draft.houseType, monthlyRent);
  const phoneBlocked = phoneGateBlocksSubmit(verification.status);
  const canSubmit =
    hasEnoughPhotos(draft.photos.length) && draft.landlordAware && !isSubmitting && !phoneBlocked;

  const submitLabel = !hasEnoughPhotos(draft.photos.length)
    ? captureMoreLabel(draft.photos.length)
    : verification.status === 'unverified'
      ? 'Verify your phone first'
      : !draft.landlordAware
        ? 'Confirm the details first'
        : isSubmitting
          ? 'Uploading photos…'
          : 'Submit Listing';

  return (
    <Screen
      header={<ScreenHeader title="Review Listing" />}
      bottomBar={
        <Button
          shape="pill"
          disabled={!canSubmit}
          label={submitLabel}
          onPress={async () => {
            setSubmitError('');
            setIsSubmitting(true);
            try {
              await submitDraft();
              router.replace(appRoutes.listingSubmitted);
            } catch (err) {
              if (err instanceof ApiRequestError && isPhoneVerificationError(err.code)) {
                // Server is the authority: surface the verification card and
                // keep the draft intact.
                verification.markUnverified();
                setSubmitError('Verify your phone number below, then submit again.');
              } else {
                setSubmitError(
                  err instanceof Error
                    ? err.message
                    : 'Upload failed. Check your connection and try again.',
                );
              }
              setIsSubmitting(false);
            }
          }}
        />
      }
    >
      <View className="gap-1">
        <Text className="font-display text-headline-md text-foreground">Listing Preview</Text>
        <Text className="font-body text-body-md text-muted-foreground">
          This is how your property will appear to potential buyers.
        </Text>
      </View>

      <ListingPreviewCard draft={draft} monthlyRent={monthlyRent} />

      <View className="flex-row items-center gap-4 rounded-[16px] bg-primary p-5">
        <View className="h-12 w-12 items-center justify-center rounded-[12px] bg-white/15">
          <AppIcon name="cash-outline" size={24} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="font-body-medium text-label-md text-white/80">Potential Earnings</Text>
          <Text className="font-display text-headline-md text-white">
            KES {pricing.posterEarningsKes.toLocaleString()}
          </Text>
          <Text className="font-body text-label-md text-white/70">
            Paid on confirmed move-in (70% of the success fee)
          </Text>
        </View>
      </View>

      <PhoneVerificationCard verification={verification} />

      <View className="gap-2 rounded-[16px] bg-warning/15 p-4">
        <View className="flex-row items-center gap-2">
          <AppIcon name="warning-outline" size={18} color="#B8860B" />
          <Text className="font-display text-body-lg text-on-warning">Important Notes</Text>
        </View>
        {[
          'Manual review required before publishing',
          `Earn KES ${pricing.posterEarningsKes.toLocaleString()} on a confirmed move-in`,
          'Review usually takes 24–48 hours',
        ].map((note) => (
          <View key={note} className="flex-row gap-2">
            <Text className="font-body text-body-md text-on-warning">•</Text>
            <Text className="flex-1 font-body text-body-md text-on-warning">{note}</Text>
          </View>
        ))}
      </View>

      <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
        <Text className="font-display text-headline-sm text-foreground">What happens next</Text>
        {[
          { icon: 'checkmark-circle' as const, done: true, title: 'Submit Listing', body: 'Review details and submit for moderation.' },
          { icon: 'time-outline' as const, done: false, title: 'Manual Review', body: 'Our team verifies the property details.' },
          { icon: 'megaphone-outline' as const, done: false, title: 'Go Live & Earn', body: 'Listing becomes public and you start earning.' },
        ].map((step, index, all) => (
          <View key={step.title} className="flex-row gap-3">
            <View className="items-center">
              <AppIcon name={step.icon} size={20} color={step.done ? '#00667E' : '#8D9192'} />
              {index < all.length - 1 ? <View className="mt-1 w-px flex-1 bg-border" /> : null}
            </View>
            <View className="flex-1 pb-1">
              <Text className="font-body-medium text-body-lg text-foreground">{step.title}</Text>
              <Text className="font-body text-body-md text-muted-foreground">{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.landlordAware }}
        onPress={() => updateDraft({ landlordAware: !draft.landlordAware })}
        className="flex-row items-start gap-3"
      >
        <AppIcon
          active={draft.landlordAware}
          name={draft.landlordAware ? 'checkbox' : 'square-outline'}
          size={22}
        />
        <Text className="flex-1 font-body text-body-md text-muted-foreground">
          I confirm all details are accurate, the landlord or caretaker knows this unit is listed,
          and I agree to the <Text className="text-primary">Terms of Service</Text> and{' '}
          <Text className="text-primary">Listing Policy</Text>.
        </Text>
      </Pressable>

      {submitError ? (
        <View className="flex-row items-start gap-2 rounded-[16px] bg-danger/10 p-4">
          <AppIcon name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{submitError}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

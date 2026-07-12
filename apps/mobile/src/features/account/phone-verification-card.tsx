/**
 * Purpose: Inline card that walks the poster through phone verification
 * (number entry, then OTP entry) right where they are blocked: above the
 * submit button on the listing review screen.
 * Why important: without a verified phone the API refuses the listing;
 * surfacing the fix in place beats bouncing users to a settings screen.
 * Used by: ListingReviewScreen.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verificationStepFor } from './phone-verification-gate';
import type { PhoneVerification } from './use-phone-verification';

export function PhoneVerificationCard({ verification }: { verification: PhoneVerification }) {
  const [code, setCode] = useState('');
  const step = verificationStepFor(verification.status, verification.codeRequested);

  if (step === 'hidden') {
    return null;
  }

  return (
    <View className="gap-4 rounded-[16px] bg-card p-5 shadow-card">
      <View className="flex-row items-center gap-2">
        <AppIcon name="call-outline" size={18} active />
        <Text className="font-display text-headline-sm text-foreground">
          Verify your phone to submit
        </Text>
      </View>
      <Text className="font-body text-body-md text-muted-foreground">
        Movers unlock your number to reach you, so we confirm it works before your
        listing goes live.
      </Text>

      {step === 'enter-phone' ? (
        <>
          <Input
            label="M-Pesa / Safaricom number"
            value={verification.phoneNumber}
            onChangeText={verification.setPhoneNumber}
            placeholder="0712 345 678"
            keyboardType="phone-pad"
          />
          <Button
            shape="pill"
            disabled={verification.busy}
            label={verification.busy ? 'Sending code…' : 'Send verification code'}
            onPress={() => void verification.requestCode()}
          />
        </>
      ) : (
        <>
          <Text className="font-body text-body-md text-muted-foreground">
            Enter the 6-digit code sent to{' '}
            <Text className="font-body-medium text-foreground">{verification.phoneNumber}</Text>.
          </Text>
          <Input
            label="Verification code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            shape="pill"
            disabled={verification.busy || code.trim().length < 4}
            label={verification.busy ? 'Verifying…' : 'Verify phone'}
            onPress={() => void verification.confirmCode(code)}
          />
          <Pressable
            accessibilityRole="button"
            disabled={verification.busy}
            onPress={() => void verification.requestCode()}
          >
            <Text className="text-center font-body-medium text-body-md text-primary">
              Resend code
            </Text>
          </Pressable>
        </>
      )}

      {verification.error ? (
        <View className="flex-row items-start gap-2 rounded-[12px] bg-danger/10 p-3">
          <AppIcon name="alert-circle" size={16} color="#FF3B30" />
          <Text className="flex-1 font-body text-body-md text-danger">{verification.error}</Text>
        </View>
      ) : null}
    </View>
  );
}

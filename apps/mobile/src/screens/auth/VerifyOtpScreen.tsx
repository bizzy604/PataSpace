/**
 * Purpose: Phone-OTP verification during sign-up. Reads the phone number
 *   RegisterScreen passed as a route param and drives it against the
 *   unchanged POST /auth/verify-otp and POST /auth/resend-otp endpoints —
 *   Authentication/otp_verification chrome (teal check hero, 6-box code,
 *   resend countdown, Verify) is unchanged.
 * Why important: Completes registration; on success the auth provider has a
 *   full session (verify-otp returns AuthSessionResponse), so this screen can
 *   go straight home instead of a separate login step.
 * Used by: app/verify-otp.tsx.
 *
 * Design delta: this now verifies the *phone* (SMS OTP), not email — Clerk's
 * email-code verification is gone along with Clerk itself; the product
 * always intended phone verification here (decision 1 in
 * Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md), the pre-migration
 * screen only used email because Clerk's auth was email-based.
 */
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/features/auth/auth-provider';
import { appRoutes } from '@/lib/routes';
import { AuthError, AuthHeader, AuthScreen, getApiErrorMessage } from './auth-shared';
import { OtpInput } from './fields';

const RESEND_SECONDS = 45;

export function VerifyOtpScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber?: string }>();
  const { verifyOtp, resendOtp } = useAuthSession();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!phoneNumber) {
    return (
      <AuthScreen
        header={<AuthHeader title="Verify Phone" onBack={() => router.replace(appRoutes.register)} />}
        footer={
          <Button label="Back to sign up" onPress={() => router.replace(appRoutes.register)} />
        }
      >
        <View className="items-center gap-3 pt-10">
          <Text className="font-display text-headline-md text-foreground">Start sign-up again</Text>
          <Text className="text-center font-body text-body-md text-muted-foreground">
            There is no pending phone verification for this device. Create an account first and
            we’ll send you a code.
          </Text>
        </View>
      </AuthScreen>
    );
  }

  async function resend() {
    if (secondsLeft > 0 || isResending || !phoneNumber) return;
    setIsResending(true);
    try {
      await resendOtp({ phoneNumber });
      setError('');
      setNotice('Code sent again.');
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend the verification code.'));
      setNotice('');
    } finally {
      setIsResending(false);
    }
  }

  async function verify() {
    if (isVerifying || !phoneNumber) return;
    if (otp.trim().length < 4) {
      setError('Enter the code to continue.');
      setNotice('');
      return;
    }
    setIsVerifying(true);
    try {
      await verifyOtp({ phoneNumber, code: otp.trim() });
      setError('');
      setNotice('');
      router.replace(appRoutes.home);
    } catch (err) {
      setError(getApiErrorMessage(err, 'That verification code is not valid.'));
      setNotice('');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <AuthScreen
      header={
        <AuthHeader title="Verify Phone" onBack={() => router.replace(appRoutes.register)} />
      }
      footer={
        <Button
          label={isVerifying ? 'Verifying…' : 'Verify'}
          disabled={isVerifying || otp.trim().length < 4}
          onPress={verify}
        />
      }
    >
      <View className="items-center gap-8 pt-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
          <AppIcon name="checkmark-circle" size={40} inverse />
        </View>

        <View className="items-center gap-2">
          <Text className="font-display text-headline-lg text-foreground">Enter Verification Code</Text>
          <Text className="max-w-[300px] text-center font-body text-body-md text-muted-foreground">
            We’ve sent a code to {phoneNumber}.
          </Text>
        </View>

        <View className="w-full">
          <OtpInput value={otp} onChangeText={setOtp} />
        </View>

        {secondsLeft > 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            Resend code in{' '}
            <Text className="font-body-bold text-primary">
              0:{secondsLeft.toString().padStart(2, '0')}
            </Text>
          </Text>
        ) : (
          <Pressable onPress={resend} disabled={isResending}>
            <Text className="font-body-medium text-body-md text-primary">
              {isResending ? 'Resending…' : 'Resend code'}
            </Text>
          </Pressable>
        )}

        {notice ? (
          <Text className="font-body-medium text-body-md text-muted-foreground">{notice}</Text>
        ) : null}
        <AuthError message={error} />
      </View>
    </AuthScreen>
  );
}

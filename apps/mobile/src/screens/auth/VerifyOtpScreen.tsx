/**
 * Purpose: Email verification during sign-up. Restyle of the old verify screen
 *   to Authentication/otp_verification — teal check hero, 6-box code, resend
 *   countdown, Verify. Clerk verifyEmailCode + finalize logic is unchanged.
 * Why important: Completes registration; the Clerk verification must behave
 *   exactly as before.
 * Used by: app/verify-otp.tsx.
 */
import { useEffect, useState } from 'react';
import { useAuth, useSignUp } from '@clerk/expo';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { AuthError, AuthHeader, AuthScreen, getClerkErrorMessage } from './auth-shared';
import { OtpInput } from './fields';

const RESEND_SECONDS = 45;

export function VerifyOtpScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const router = useRouter();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!signUp || isSignedIn || signUp.status === 'complete') {
    return null;
  }

  const awaitingEmailVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  if (!awaitingEmailVerification) {
    return (
      <AuthScreen
        header={<AuthHeader title="Verify Email" onBack={() => router.replace(appRoutes.register)} />}
        footer={
          <Button
            label="Back to sign up"
            onPress={async () => {
              await signUp.reset();
              router.replace(appRoutes.register);
            }}
          />
        }
      >
        <View className="items-center gap-3 pt-10">
          <Text className="font-display text-headline-md text-foreground">Start sign-up again</Text>
          <Text className="text-center font-body text-body-md text-muted-foreground">
            There is no pending email verification for this device. Create an account first and
            we’ll send you a code.
          </Text>
        </View>
      </AuthScreen>
    );
  }

  async function resend() {
    if (!signUp || secondsLeft > 0) return;
    const { error: resendError } = await signUp.verifications.sendEmailCode();
    if (resendError) {
      setError(getClerkErrorMessage(resendError, 'Could not resend the verification code.'));
      setNotice('');
      return;
    }
    setError('');
    setNotice('Code sent again.');
    setSecondsLeft(RESEND_SECONDS);
  }

  async function verify() {
    if (!signUp) return;
    if (otp.trim().length < 6) {
      setError('Enter the 6-digit code to continue.');
      setNotice('');
      return;
    }
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: otp.trim() });
    if (verifyError) {
      setError(getClerkErrorMessage(verifyError, 'That verification code is not valid.'));
      setNotice('');
      return;
    }
    if (signUp.status !== 'complete') {
      setError('Your sign-up is not complete yet. Check your Clerk sign-up settings.');
      setNotice('');
      return;
    }
    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) {
      setError(getClerkErrorMessage(finalizeError, 'Could not finish signing you in.'));
      return;
    }
    setError('');
    setNotice('');
    router.replace(appRoutes.home);
  }

  return (
    <AuthScreen
      header={
        <AuthHeader
          title="Verify Email"
          onBack={async () => {
            await signUp.reset();
            router.replace(appRoutes.register);
          }}
        />
      }
      footer={
        <Button
          label={fetchStatus === 'fetching' ? 'Verifying…' : 'Verify'}
          disabled={fetchStatus === 'fetching' || otp.trim().length < 6}
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
            We’ve sent a 6-digit code to {signUp.emailAddress ?? 'your email address'}.
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
          <Pressable onPress={resend}>
            <Text className="font-body-medium text-body-md text-primary">Resend code</Text>
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

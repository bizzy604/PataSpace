/**
 * Purpose: Password-reset entry screen, built from the
 *   Authentication/forgot_password_phone wireframe
 *   (Docs/Wireframes/PataSpace Design Screens) — dark shell header, "Forgot
 *   Password?" headline, a single field, sticky "Send Reset Code", and a
 *   support link. Calls POST /auth/forgot-password and always routes forward
 *   to ResetPasswordScreen, matching the endpoint's anti-enumeration
 *   response (identical 200 whether or not the account exists).
 * Why important: This flow was explicitly skipped in the original mobile
 *   redesign ("Clerk owns those flows" — Docs/12_Mobile_Redesign_Plan.md);
 *   Clerk is gone, so it's built now per
 *   Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md Phase 2.
 * Used by: app/forgot-password.tsx.
 *
 * Design delta: the wireframe's field is a phone number. The Phase-1 API's
 * forgot-password endpoint is keyed by email (same anti-enumeration lookup
 * shape as login), and sends the OTP to the phone on file server-side — the
 * user never chooses which channel. This screen asks for email to match the
 * real contract; the code still arrives by SMS, which ResetPasswordScreen's
 * copy makes explicit.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuthSession } from '@/features/auth/auth-provider';
import { appRoutes, resetPasswordHref } from '@/lib/routes';
import { AuthError, AuthScreen, getApiErrorMessage, isValidEmail } from './auth-shared';

export function ForgotPasswordScreen() {
  const { forgotPassword } = useAuthSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    if (isSubmitting) return;
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Always 200 regardless of whether the account exists (anti-
      // enumeration) — the UI must not reveal which branch happened.
      await forgotPassword({ email: email.trim().toLowerCase() });
      setError('');
      router.push(resetPasswordHref(email.trim().toLowerCase()));
    } catch (err) {
      // A genuine failure here (network error, validation error) is safe to
      // surface — it says nothing about whether the account exists.
      setError(getApiErrorMessage(err, 'Could not send the reset code. Try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      header={<ScreenHeader title="PataSpace" onBack={() => router.replace(appRoutes.login)} />}
      footer={
        <Button
          label={isSubmitting ? 'Sending…' : 'Send Reset Code'}
          onPress={submit}
          disabled={isSubmitting}
        />
      }
    >
      <View className="gap-6">
        <View className="gap-2">
          <Text className="font-display text-headline-lg text-foreground">Forgot Password?</Text>
          <Text className="font-body text-body-md text-muted-foreground">
            Enter your registered email to receive a reset code by SMS.
          </Text>
        </View>

        <Input
          label="Email address"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          className={error ? 'border-danger' : undefined}
          value={email}
          onChangeText={setEmail}
        />

        <AuthError message={error} />
      </View>
    </AuthScreen>
  );
}

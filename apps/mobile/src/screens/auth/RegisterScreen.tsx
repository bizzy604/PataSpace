/**
 * Purpose: Create-account screen. Restyle of the old register to
 *   Authentication/phone_registration — header, labeled fields, sticky
 *   Continue, legal note, and Google/Apple SSO. Clerk sign-up logic (email +
 *   password + phone/name metadata, email verification) is unchanged.
 * Why important: Entry point for new accounts; the Clerk email auth must keep
 *   working exactly as before while the surface matches the new design.
 * Used by: app/register.tsx.
 */
import { useState } from 'react';
import { useAuth, useSignUp } from '@clerk/expo';
import { Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import {
  AuthDivider,
  AuthError,
  AuthHeader,
  AuthScreen,
  SocialAuthButton,
  buildSocialMetadata,
  getClerkErrorMessage,
  getSocialProviderLabel,
  isValidEmail,
  normalizePhoneForMetadata,
  useSocialAuthFlow,
  type SocialStrategy,
} from './auth-shared';
import { PasswordField, PhoneField } from './fields';

export function RegisterScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const { pendingStrategy, authenticateWithSocial } = useSocialAuthFlow();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  if (!signUp || isSignedIn || signUp.status === 'complete') {
    return null;
  }

  const isBusy = fetchStatus === 'fetching' || pendingStrategy !== null;

  async function continueWithSocial(strategy: SocialStrategy) {
    if (phone.replace(/\D/g, '').length < 9) {
      setError(
        `Enter a valid Kenyan phone number before continuing with ${getSocialProviderLabel(strategy)}.`,
      );
      return;
    }
    setError('');
    const result = await authenticateWithSocial({
      strategy,
      fallbackRoute: appRoutes.register,
      unsafeMetadata: buildSocialMetadata({ firstName, lastName, phone }),
    });
    if (!result.ok && !result.cancelled) {
      setError(result.message);
    }
  }

  async function submitRegister() {
    if (!signUp) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Enter a valid Kenyan phone number.');
      return;
    }
    if (!isValidEmail(emailAddress)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.trim().length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const { error: signUpError } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
      unsafeMetadata: {
        phone: normalizePhoneForMetadata(phone),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });
    if (signUpError) {
      setError(getClerkErrorMessage(signUpError, 'Could not create your account.'));
      return;
    }

    const { error: verificationError } = await signUp.verifications.sendEmailCode();
    if (verificationError) {
      setError(getClerkErrorMessage(verificationError, 'Could not send the verification code.'));
      return;
    }

    setError('');
    router.push(appRoutes.verifyOtp);
  }

  return (
    <AuthScreen
      header={<AuthHeader title="Create Account" onBack={() => router.replace(appRoutes.login)} />}
      footer={
        <View className="gap-3">
          <Button
            label={fetchStatus === 'fetching' ? 'Creating account…' : 'Continue'}
            onPress={submitRegister}
            disabled={isBusy}
          />
          <Text className="text-center font-body text-label-md text-muted-foreground">
            By tapping “Continue”, you agree to PataSpace’s{' '}
            <Text className="font-body-bold text-primary">Terms of Service</Text> and{' '}
            <Text className="font-body-bold text-primary">Privacy Policy</Text>.
          </Text>
        </View>
      }
    >
      <View className="gap-5">
        <View className="gap-2">
          <Text className="font-display text-headline-lg text-foreground">
            Enter Your Details
          </Text>
          <Text className="font-body text-body-md text-muted-foreground">
            We’ll send a verification code to confirm your email.
          </Text>
        </View>

        <Input label="First name" placeholder="e.g. John" autoCapitalize="words" value={firstName} onChangeText={setFirstName} />
        <Input label="Last name" placeholder="e.g. Doe" autoCapitalize="words" value={lastName} onChangeText={setLastName} />
        <PhoneField value={phone} onChangeText={setPhone} />
        <Input
          label="Email address"
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={emailAddress}
          onChangeText={setEmailAddress}
        />
        <PasswordField value={password} onChangeText={setPassword} placeholder="Create a secure password" />
        <PasswordField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" />

        <AuthError message={error} />

        <AuthDivider label="Or sign up with" />
        <View className="gap-3">
          <SocialAuthButton
            strategy="oauth_google"
            pendingStrategy={pendingStrategy}
            disabled={isBusy}
            onPress={() => void continueWithSocial('oauth_google')}
          />
          {Platform.OS === 'ios' ? (
            <SocialAuthButton
              strategy="oauth_apple"
              pendingStrategy={pendingStrategy}
              disabled={isBusy}
              onPress={() => void continueWithSocial('oauth_apple')}
            />
          ) : null}
        </View>

        <Pressable className="items-center py-2" onPress={() => router.replace(appRoutes.login)}>
          <Text className="font-body text-body-md text-muted-foreground">
            Already have an account? <Text className="font-body-bold text-primary">Log in</Text>
          </Text>
        </Pressable>

        <View nativeID="clerk-captcha" />
      </View>
    </AuthScreen>
  );
}

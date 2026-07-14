/**
 * Purpose: Create-account screen. Collects email + password + names + phone,
 *   calls POST /auth/register, then routes to VerifyOtpScreen (phone OTP,
 *   unchanged endpoint) — Authentication/phone_registration chrome (header,
 *   labeled fields, sticky Continue, legal note) is unchanged.
 * Why important: Entry point for new accounts.
 * Used by: app/register.tsx.
 *
 * Design delta: Google/Apple SSO buttons, the "Or sign up with" divider, and
 * the Clerk captcha mount point are removed — SSO is dropped entirely per
 * the migration plan (decision 3), not deferred. Email verification via
 * Clerk's sendEmailCode is gone too: verification rides the phone-OTP rails
 * already used elsewhere (decision 1), so this screen routes straight to
 * VerifyOtpScreen with the registered phone number.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthSession } from '@/features/auth/auth-provider';
import { appRoutes, verifyOtpHref } from '@/lib/routes';
import {
  AuthError,
  AuthHeader,
  AuthScreen,
  getApiErrorMessage,
  isValidEmail,
  normalizePhoneForApi,
  passwordPolicyError,
} from './auth-shared';
import { PasswordField, PhoneField } from './fields';

export function RegisterScreen() {
  const { register } = useAuthSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submitRegister() {
    if (isSubmitting) return;
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
    const passwordError = passwordPolicyError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const normalizedPhone = normalizePhoneForApi(phone);

    setIsSubmitting(true);
    try {
      await register({
        email: emailAddress.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: normalizedPhone,
      });
      setError('');
      router.push(verifyOtpHref(normalizedPhone));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      header={<AuthHeader title="Create Account" onBack={() => router.replace(appRoutes.login)} />}
      footer={
        <View className="gap-3">
          <Button
            label={isSubmitting ? 'Creating account…' : 'Continue'}
            onPress={submitRegister}
            disabled={isSubmitting}
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
            We’ll send a verification code to confirm your phone number.
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

        <Pressable className="items-center py-2" onPress={() => router.replace(appRoutes.login)}>
          <Text className="font-body text-body-md text-muted-foreground">
            Already have an account? <Text className="font-body-bold text-primary">Log in</Text>
          </Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

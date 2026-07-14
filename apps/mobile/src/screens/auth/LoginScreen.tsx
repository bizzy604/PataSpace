/**
 * Purpose: Sign-in screen. Email + password against POST /auth/login via the
 *   auth provider; Authentication/login_screen chrome (logo, labeled fields,
 *   sticky Sign In + Create New Account) is unchanged. Restores the "Forgot
 *   Password?" link that was omitted in the mobile redesign because Clerk
 *   owned password reset — it doesn't anymore (see
 *   Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md).
 * Why important: The returning-user entry point.
 * Used by: app/login.tsx.
 *
 * Design delta: Google/Apple SSO buttons and the "Or continue with" divider
 * are removed, not restyled — SSO is dropped entirely per the migration plan
 * (decision 3), not deferred.
 */
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthSession } from '@/features/auth/auth-provider';
import { appRoutes } from '@/lib/routes';
import { AuthError, AuthScreen, getApiErrorMessage, isValidEmail } from './auth-shared';
import { PasswordField } from './fields';

const pataspaceLogo = require('../../../assets/PataSpace Logo.png');

export function LoginScreen() {
  const { login } = useAuthSession();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submitLogin() {
    if (isSubmitting) return;
    if (!isValidEmail(emailAddress) || !password.trim()) {
      setError('Enter a valid email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: emailAddress.trim().toLowerCase(), password });
      setError('');
      router.replace(appRoutes.home);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not sign you in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footer={
        <View className="gap-3">
          <Button
            label={isSubmitting ? 'Signing in…' : 'Sign In'}
            onPress={submitLogin}
            disabled={isSubmitting}
          />
          <Button
            label="Create New Account"
            variant="outline"
            onPress={() => router.replace(appRoutes.register)}
          />
        </View>
      }
    >
      <View className="gap-6">
        <View className="items-center gap-4 pt-2">
          <Text className="font-body text-body-md text-muted-foreground">Welcome Back</Text>
          <Image className="h-16 w-16" resizeMode="contain" source={pataspaceLogo} />
          <Text className="font-display text-display-02 text-foreground">Sign In</Text>
        </View>

        <View className="gap-5">
          <Input
            label="Email address"
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            className={error ? 'border-danger' : undefined}
            value={emailAddress}
            onChangeText={setEmailAddress}
          />
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            invalid={!!error}
          />

          <Pressable className="items-end" onPress={() => router.push(appRoutes.forgotPassword)}>
            <Text className="font-body-medium text-body-md text-primary">Forgot Password?</Text>
          </Pressable>

          <AuthError message={error} />
        </View>
      </View>
    </AuthScreen>
  );
}

/**
 * Purpose: Sign-in screen. Restyle of the old login to
 *   Authentication/login_screen — logo, labeled fields, sticky Sign In +
 *   Create New Account, and Google/Apple SSO. Clerk sign-in logic (password,
 *   the needs_client_trust email-code step, SSO) is unchanged.
 * Why important: The returning-user entry point; Clerk auth must behave exactly
 *   as before behind the new surface.
 * Used by: app/login.tsx.
 *
 * Note: the design shows a "Forgot Password?" link; it is intentionally omitted
 * because password reset is a Clerk-hosted workflow not built into the app yet
 * (see Docs/12_Mobile_Redesign_Plan.md). Wire the link when that flow lands.
 */
import { useState } from 'react';
import { useSignIn } from '@clerk/expo';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import {
  AuthDivider,
  AuthError,
  AuthHeader,
  AuthScreen,
  SocialAuthButton,
  getClerkErrorMessage,
  isValidEmail,
  useSocialAuthFlow,
  type SocialStrategy,
} from './auth-shared';
import { OtpInput, PasswordField } from './fields';

const pataspaceLogo = require('../../../assets/PataSpace Logo.png');

export function LoginScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const { pendingStrategy, authenticateWithSocial } = useSocialAuthFlow();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  if (!signIn) {
    return null;
  }

  const isBusy = fetchStatus === 'fetching' || pendingStrategy !== null;

  async function finalizeSignIn() {
    if (!signIn) return false;
    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setError(getClerkErrorMessage(finalizeError, 'Could not finish signing you in.'));
      return false;
    }
    router.replace(appRoutes.home);
    return true;
  }

  async function submitLogin() {
    if (!signIn) return;
    if (!isValidEmail(emailAddress) || !password.trim()) {
      setError('Enter a valid email address and password.');
      return;
    }

    const { error: signInError } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });
    if (signInError) {
      setError(getClerkErrorMessage(signInError, 'Could not sign you in.'));
      setNotice('');
      return;
    }

    if (signIn.status === 'complete') {
      setError('');
      setNotice('');
      await finalizeSignIn();
      return;
    }

    if (signIn.status === 'needs_client_trust') {
      const { error: sendCodeError } = await signIn.mfa.sendEmailCode();
      if (sendCodeError) {
        setError(getClerkErrorMessage(sendCodeError, 'Could not send the sign-in verification code.'));
        return;
      }
      setError('');
      setNotice('Clerk sent a verification code to your email.');
      return;
    }

    if (signIn.status === 'needs_second_factor') {
      setError('This account requires a second factor that is not configured in the mobile app yet.');
      return;
    }

    setError('Sign-in is not complete yet. Check your Clerk sign-in settings.');
  }

  async function continueWithSocial(strategy: SocialStrategy) {
    setError('');
    setNotice('');
    const result = await authenticateWithSocial({ strategy, fallbackRoute: appRoutes.login });
    if (!result.ok && !result.cancelled) {
      setError(result.message);
    }
  }

  // Device-trust step: Clerk asks for an email code before opening the session.
  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthScreen
        header={
          <AuthHeader
            title="Verify Sign-In"
            onBack={async () => {
              await signIn.reset();
              setCode('');
              setError('');
              setNotice('');
            }}
          />
        }
        footer={
          <Button
            label={fetchStatus === 'fetching' ? 'Verifying…' : 'Verify'}
            disabled={fetchStatus === 'fetching' || code.trim().length === 0}
            onPress={async () => {
              if (!code.trim()) {
                setError('Enter the verification code.');
                return;
              }
              const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
              if (verifyError) {
                setError(getClerkErrorMessage(verifyError, 'That verification code is not valid.'));
                return;
              }
              if (signIn.status !== 'complete') {
                setError('Sign-in is still waiting on another step.');
                return;
              }
              setError('');
              setNotice('');
              await finalizeSignIn();
            }}
          />
        }
      >
        <View className="items-center gap-8 pt-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <AppIcon name="checkmark-circle" size={40} inverse />
          </View>
          <View className="items-center gap-2">
            <Text className="font-display text-headline-lg text-foreground">Enter Verification Code</Text>
            <Text className="text-center font-body text-body-md text-muted-foreground">
              We sent a 6-digit code to{' '}
              {typeof signIn.identifier === 'string' && signIn.identifier.trim()
                ? signIn.identifier
                : emailAddress || 'your email'}
              .
            </Text>
          </View>

          <View className="w-full">
            <OtpInput value={code} onChangeText={setCode} />
          </View>

          <Pressable
            onPress={async () => {
              const { error: resendError } = await signIn.mfa.sendEmailCode();
              if (resendError) {
                setError(getClerkErrorMessage(resendError, 'Could not resend the sign-in code.'));
                return;
              }
              setError('');
              setNotice('Code sent again.');
            }}
          >
            <Text className="font-body-medium text-body-md text-primary">Resend code</Text>
          </Pressable>

          {notice ? (
            <Text className="font-body-medium text-body-md text-muted-foreground">{notice}</Text>
          ) : null}
          <AuthError message={error} />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <View className="gap-3">
          <Button
            label={fetchStatus === 'fetching' ? 'Signing in…' : 'Sign In'}
            onPress={submitLogin}
            disabled={isBusy}
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

          <AuthError message={error} />

          <AuthDivider label="Or continue with" />
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
        </View>
      </View>
    </AuthScreen>
  );
}

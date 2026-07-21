/**
 * Purpose: Email verification screen — requests a 6-digit code + magic link
 *   email and verifies the code here. A magic-link deep link (route params
 *   email + token) verifies automatically on mount instead.
 * Why important: Completes the email-verification flow added to the API;
 *   the magic link from the email deep-links into this same screen via the
 *   pataspace:// scheme, so both the code path and the link path land here.
 * Used by: app/verify-email.tsx.
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

export function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const { user, requestEmailVerification, verifyEmailCode, verifyEmailLink } = useAuthSession();
  const router = useRouter();

  const email = params.email ?? user?.email ?? '';
  const token = params.token;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkState, setLinkState] = useState<'idle' | 'verifying' | 'done' | 'error'>('idle');

  // Magic-link deep link: verify the signed token as soon as the screen mounts.
  useEffect(() => {
    if (!token || !email || linkState !== 'idle') return;
    setLinkState('verifying');
    verifyEmailLink({ email, token })
      .then(() => {
        setLinkState('done');
        setTimeout(() => router.replace(appRoutes.profile), 1200);
      })
      .catch((err) => {
        setLinkState('error');
        setError(getApiErrorMessage(err, 'That verification link is invalid or has expired.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);
  async function sendCode() {
    if (isSending || secondsLeft > 0) return;
    setIsSending(true);
    try {
      await requestEmailVerification();
      setError('');
      setNotice('Code sent. Check your email inbox.');
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the verification email.'));
      setNotice('');
    } finally {
      setIsSending(false);
    }
  }

  async function verify() {
    if (isVerifying) return;
    if (code.trim().length < 4) {
      setError('Enter the code to continue.');
      setNotice('');
      return;
    }
    setIsVerifying(true);
    try {
      await verifyEmailCode({ code: code.trim() });
      setError('');
      router.replace(appRoutes.profile);
    } catch (err) {
      setError(getApiErrorMessage(err, 'That verification code is not valid.'));
      setNotice('');
    } finally {
      setIsVerifying(false);
    }
  }

  if (token) {
    return (
      <AuthScreen header={<AuthHeader title="Verify Email" onBack={() => router.replace(appRoutes.profile)} />}>
        <View className="items-center gap-4 pt-10">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <AppIcon name={linkState === 'error' ? 'close-circle' : 'checkmark-circle'} size={40} inverse />
          </View>
          <Text className="font-display text-headline-lg text-foreground">
            {linkState === 'done'
              ? 'Email verified'
              : linkState === 'error'
                ? 'Link did not work'
                : 'Verifying your email…'}
          </Text>
          <Text className="max-w-[300px] text-center font-body text-body-md text-muted-foreground">
            {linkState === 'done'
              ? 'Your email address is now confirmed.'
              : linkState === 'error'
                ? 'Request a fresh verification email and try again.'
                : 'Hold on while we confirm your email address.'}
          </Text>
          <AuthError message={error} />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      header={<AuthHeader title="Verify Email" onBack={() => router.replace(appRoutes.profile)} />}
      footer={
        <Button
          label={isVerifying ? 'Verifying…' : 'Verify'}
          disabled={isVerifying || code.trim().length < 4}
          onPress={verify}
        />
      }
    >
      <View className="items-center gap-8 pt-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
          <AppIcon name="mail-outline" size={40} inverse />
        </View>

        <View className="items-center gap-2">
          <Text className="font-display text-headline-lg text-foreground">Verify your email</Text>
          <Text className="max-w-[300px] text-center font-body text-body-md text-muted-foreground">
            We send a 6-digit code and a verification link to {email || 'your email address'}.
          </Text>
        </View>

        {secondsLeft > 0 ? (
          <Text className="font-body text-body-md text-muted-foreground">
            Resend code in{' '}
            <Text className="font-body-bold text-primary">
              0:{secondsLeft.toString().padStart(2, '0')}
            </Text>
          </Text>
        ) : (
          <Pressable onPress={sendCode} disabled={isSending}>
            <Text className="font-body-medium text-body-md text-primary">
              {isSending ? 'Sending…' : notice ? 'Resend code' : 'Send verification code'}
            </Text>
          </Pressable>
        )}

        <View className="w-full">
          <OtpInput value={code} onChangeText={setCode} />
        </View>

        {notice ? (
          <Text className="font-body-medium text-body-md text-muted-foreground">{notice}</Text>
        ) : null}
        <AuthError message={error} />
      </View>
    </AuthScreen>
  );
}


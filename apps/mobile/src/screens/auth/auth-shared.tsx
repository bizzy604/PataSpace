/**
 * Purpose: Shared plumbing for the redesigned auth flow — the Clerk helpers
 *   and social-auth hook carried over verbatim from the old AuthScreens, plus
 *   the new layout shells (AuthScreen, AuthHeader) and the restyled
 *   SocialAuthButton.
 * Why important: Every auth screen is a thin presentation layer over these; the
 *   Clerk logic is untouched from the pre-redesign version so behaviour is
 *   identical while the look changes.
 * Used by: screens/auth/{Welcome,Onboarding,Register,Login,VerifyOtp}Screen.
 */
import { useSSO } from '@clerk/expo';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { useRouter, type Href } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { AppIcon } from '@/components/ui/app-icon';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';
import { appRoutes } from '@/lib/routes';

export type IconName = ComponentProps<typeof AppIcon>['name'];
export type SocialStrategy = 'oauth_google' | 'oauth_apple';

export const ssoRedirectUrl = AuthSession.makeRedirectUri({ path: 'sso-callback' });

const socialProviderConfig: Record<
  SocialStrategy,
  { icon: IconName; label: string; inverse?: boolean }
> = {
  oauth_google: { icon: 'logo-google', label: 'Google' },
  oauth_apple: { icon: 'logo-apple', label: 'Apple', inverse: true },
};

WebBrowser.maybeCompleteAuthSession();

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizePhoneForMetadata(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `+254${digits}`;
  return phone.trim();
}

export function buildSocialMetadata({
  firstName,
  lastName,
  phone,
}: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const metadata: Record<string, string> = {};
  if (phone?.trim()) metadata.phone = normalizePhoneForMetadata(phone);
  if (firstName?.trim()) metadata.firstName = firstName.trim();
  if (lastName?.trim()) metadata.lastName = lastName.trim();
  return metadata;
}

export function getSocialProviderLabel(strategy: SocialStrategy) {
  return socialProviderConfig[strategy].label;
}

export function getClerkErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback;
  const apiErrors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
  const firstError = Array.isArray(apiErrors) ? apiErrors[0] : null;
  if (firstError?.longMessage) return firstError.longMessage;
  if (firstError?.message) return firstError.message;
  const message = (error as { message?: string }).message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function useSocialAuthFlow() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [pendingStrategy, setPendingStrategy] = useState<SocialStrategy | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  async function authenticateWithSocial({
    strategy,
    fallbackRoute,
    unsafeMetadata,
  }: {
    strategy: SocialStrategy;
    fallbackRoute: Href;
    unsafeMetadata?: Record<string, unknown>;
  }) {
    const providerLabel = getSocialProviderLabel(strategy);
    try {
      setPendingStrategy(strategy);
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy,
        redirectUrl: ssoRedirectUrl,
        unsafeMetadata,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace(appRoutes.home);
        return { ok: true as const };
      }

      router.replace(fallbackRoute);
      if (authSessionResult?.type === 'cancel' || authSessionResult?.type === 'dismiss') {
        return { ok: false as const, cancelled: true as const };
      }
      return {
        ok: false as const,
        message: `Could not complete ${providerLabel} sign-in. Check the Clerk social connection settings.`,
      };
    } catch (error) {
      router.replace(fallbackRoute);
      return {
        ok: false as const,
        message: getClerkErrorMessage(error, `Could not continue with ${providerLabel}.`),
      };
    } finally {
      setPendingStrategy(null);
    }
  }

  return { pendingStrategy, authenticateWithSocial };
}

export function SocialAuthButton({
  strategy,
  pendingStrategy,
  disabled,
  onPress,
}: {
  strategy: SocialStrategy;
  pendingStrategy: SocialStrategy | null;
  disabled?: boolean;
  onPress: () => void;
}) {
  const provider = socialProviderConfig[strategy];
  const isPending = pendingStrategy === strategy;

  return (
    <Pressable
      className={cn(
        'min-h-12 flex-row items-center justify-center gap-3 rounded-full border border-border bg-surface-elevated px-4 active:opacity-90',
        disabled && 'opacity-60',
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <AppIcon name={provider.icon} size={18} active />
      <Text className="font-body-medium text-body-md text-foreground">
        {isPending ? `Connecting to ${provider.label}…` : `Continue with ${provider.label}`}
      </Text>
    </Pressable>
  );
}

/** Tinted error banner with an alert glyph (Authentication/login_error_state). */
export function AuthError({ message }: { message: string }) {
  const { theme } = useMobileApp();
  if (!message) return null;
  return (
    <View className="flex-row items-start gap-2 rounded-[12px] bg-danger/10 px-4 py-3">
      <AppIcon name="alert-circle" size={18} color={theme.danger} />
      <Text className="flex-1 font-body-medium text-body-md text-danger">{message}</Text>
    </View>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="font-body-medium text-label-md uppercase tracking-[1.5px] text-muted-foreground">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

/** Nav bar with a back chevron and a centered title (register / verify). */
export function AuthHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center border-b border-border px-4 py-3">
      <Pressable
        className="h-10 w-10 items-center justify-center active:opacity-70"
        hitSlop={8}
        onPress={onBack ?? (() => router.back())}
        accessibilityLabel="Go back"
      >
        <AppIcon name="chevron-back" size={22} active />
      </Pressable>
      <Text className="flex-1 text-center font-display text-headline-sm text-foreground">
        {title}
      </Text>
      {/* Spacer to keep the title optically centered against the back button. */}
      <View className="h-10 w-10" />
    </View>
  );
}

/**
 * Full-screen auth layout: optional header, a scrollable body, and an optional
 * footer pinned above the home indicator. `dark` renders the splash hero.
 */
export function AuthScreen({
  header,
  children,
  footer,
  dark = false,
  contentClassName,
}: {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  dark?: boolean;
  contentClassName?: string;
}) {
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className={cn('flex-1', dark ? 'bg-surface-inverse' : 'bg-background')}
    >
      <StatusBar style={dark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {header}
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24 }}
        >
          <View className={cn('flex-1', contentClassName)}>{children}</View>
        </ScrollView>
        {footer ? <View className="px-4 pb-2 pt-3">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

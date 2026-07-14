/**
 * Purpose: Shared plumbing for the auth flow — email/phone helpers, the
 *   ApiRequestError-to-message mapper, and the layout shells (AuthScreen,
 *   AuthHeader, AuthError) every auth screen renders inside.
 * Why important: Every auth screen (register, login, verify-otp, forgot/
 *   reset password) is a thin presentation layer over these; keeping the
 *   error-mapping and layout logic here means the screens only differ in
 *   fields and which API call they make.
 * Used by: screens/auth/{Register,Login,VerifyOtp,ForgotPassword,
 *   ResetPassword}Screen.
 *
 * Note: SSO (Google/Apple via @clerk/expo's useSSO) is deliberately removed,
 * not adapted — the Clerk-removal plan drops SSO entirely (credential-only
 * accounts; see Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md decision
 * 3). The sso-callback.tsx route is deleted alongside this.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ApiRequestError } from '@/lib/api-client';
import { AppIcon } from '@/components/ui/app-icon';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Kenyan local/international phone input -> the API's expected +254E.164 shape. */
export function normalizePhoneForApi(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `+254${digits}`;
  return phone.trim();
}

/**
 * Mirrors packages/contracts/src/schemas/auth.ts's passwordSchema (min 8,
 * one uppercase, one number, one special character) so a weak password fails
 * fast in the UI instead of round-tripping to the API for a 400.
 */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Include at least one special character.';
  return null;
}

/** Maps an apiFetch failure to user-facing copy; falls back for non-API errors. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError && error.message.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
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

/** Nav bar with a back chevron and a centered title (register / verify / forgot / reset). */
export function AuthHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View className="flex-row items-center border-b border-border px-4 py-3">
      <Pressable
        className="h-10 w-10 items-center justify-center active:opacity-70"
        hitSlop={8}
        onPress={onBack}
        accessibilityLabel="Go back"
      >
        {onBack ? <AppIcon name="chevron-back" size={22} active /> : null}
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

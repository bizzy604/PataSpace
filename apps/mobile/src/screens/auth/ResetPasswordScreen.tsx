/**
 * Purpose: New-password screen, built from the
 *   Authentication/reset_password_form wireframe (Docs/Wireframes/PataSpace
 *   Design Screens) — dark shell header, "Create New Password" headline,
 *   password + confirm fields, a live requirements checklist, sticky "Update
 *   Password". Calls POST /auth/reset-password (email + code + newPassword);
 *   on success every existing session for the account is revoked server-side,
 *   so this screen routes to Login, not Home.
 * Why important: Completes the reset flow ForgotPasswordScreen starts. Built
 *   now because Clerk (which used to own this flow) is gone — see
 *   Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md Phase 2.
 * Used by: app/reset-password.tsx.
 *
 * Design delta: the wireframe has no code field — it assumes a tapped email
 * link carries the token. This migration has no mailer (decision 5 in the
 * plan doc); the OTP rides SMS, so the user must type it in. A 6-box code
 * field (matching the OtpInput used on VerifyOtpScreen) is added above the
 * password fields; everything else matches the wireframe.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuthSession } from '@/features/auth/auth-provider';
import { appRoutes } from '@/lib/routes';
import { AuthError, AuthScreen, getApiErrorMessage } from './auth-shared';
import { OtpInput, PasswordField } from './fields';

type Requirement = { met: boolean; label: string };

function passwordRequirements(password: string): Requirement[] {
  return [
    { met: password.length >= 8, label: 'Min 8 characters' },
    { met: /[A-Z]/.test(password), label: '1 uppercase letter' },
    { met: /[0-9]/.test(password), label: '1 number' },
    { met: /[^A-Za-z0-9]/.test(password), label: '1 special character' },
  ];
}

function RequirementRow({ met, label }: Requirement) {
  return (
    <View className="flex-row items-center gap-2">
      <AppIcon name={met ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} active={met} />
      <Text
        className={
          met
            ? 'font-body-medium text-label-md text-primary'
            : 'font-body text-label-md text-muted-foreground'
        }
      >
        {label}
      </Text>
    </View>
  );
}

export function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = useAuthSession();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!emailParam) {
    return (
      <AuthScreen
        header={<ScreenHeader title="Reset Password" onBack={() => router.replace(appRoutes.forgotPassword)} />}
        footer={
          <Button label="Start over" onPress={() => router.replace(appRoutes.forgotPassword)} />
        }
      >
        <View className="items-center gap-3 pt-10">
          <Text className="font-display text-headline-md text-foreground">Start again</Text>
          <Text className="text-center font-body text-body-md text-muted-foreground">
            Request a reset code first, then come back here to set a new password.
          </Text>
        </View>
      </AuthScreen>
    );
  }

  // Rebind to a fresh const: `submit` closes over `emailParam`, and TS
  // control-flow narrowing from the guard above doesn't survive into a
  // closure that captures the original (possibly-undefined-typed) binding.
  const email = emailParam;

  const requirements = passwordRequirements(newPassword);
  const allRequirementsMet = requirements.every((requirement) => requirement.met);

  async function submit() {
    if (isSubmitting) return;
    if (code.trim().length < 4) {
      setError('Enter the code sent to your registered phone number.');
      return;
    }
    if (!allRequirementsMet) {
      setError('Your new password does not meet the requirements below.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        code: code.trim(),
        newPassword,
      });
      setError('');
      router.replace(appRoutes.login);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset your password. Check the code and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      header={<ScreenHeader title="Reset Password" onBack={() => router.replace(appRoutes.login)} />}
      footer={
        <Button
          label={isSubmitting ? 'Updating…' : 'Update Password'}
          onPress={submit}
          disabled={isSubmitting}
        />
      }
    >
      <View className="gap-6">
        <View className="gap-2">
          <Text className="font-display text-headline-lg text-foreground">Create New Password</Text>
          <Text className="font-body text-body-md text-muted-foreground">
            Your new password must be different from previous passwords.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="font-body-bold text-label-md uppercase tracking-[1px] text-muted-foreground">
            Verification code
          </Text>
          <Text className="font-body text-body-md text-muted-foreground">
            Enter the code sent to your registered phone number.
          </Text>
          <OtpInput value={code} onChangeText={setCode} autoFocus={false} />
        </View>

        <View className="gap-5">
          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
          />
        </View>

        <View className="gap-2 rounded-[12px] border border-border bg-surface-subtle p-4">
          {requirements.map((requirement) => (
            <RequirementRow key={requirement.label} {...requirement} />
          ))}
        </View>

        <AuthError message={error} />
      </View>
    </AuthScreen>
  );
}

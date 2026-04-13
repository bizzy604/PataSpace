import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { ColorSchemeToggle } from '@/components/ui/color-scheme-toggle';
import { MotionView } from '@/components/ui/motion-view';
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';
import { appRoutes } from '@/lib/routes';

type IconName = ComponentProps<typeof AppIcon>['name'];
const pataspaceLogo = require('../../assets/PataSpace Logo.png');

function AuthShell({
  eyebrow = 'PataSpace',
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { theme } = useMobileApp();

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: 20, paddingBottom: 24 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center"
      >
        <View className="absolute inset-0" pointerEvents="none">
          <View
            className="absolute -left-12 top-24 h-52 w-52 rounded-full"
            style={{ backgroundColor: theme.authBackdropA }}
          />
          <View
            className="absolute -right-8 bottom-16 h-64 w-64 rounded-full"
            style={{ backgroundColor: theme.authBackdropB }}
          />
        </View>

        <View className="gap-6">
          <MotionView className="items-center" distance={10}>
            <ColorSchemeToggle />
          </MotionView>

          <MotionView distance={18}>
            <View
              className="overflow-hidden rounded-[38px] border px-6 pb-6 pt-8"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadowColor,
                shadowOpacity: theme.mode === 'dark' ? 0.24 : 0.1,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 16 },
                elevation: 12,
              }}
            >
              <View
                className="absolute h-20 w-52 rounded-full"
                style={{
                  top: -32,
                  left: '50%',
                  marginLeft: -104,
                  backgroundColor: theme.authPanelGlow,
                }}
              />

              <View className="items-center gap-4">
                <View
                  className="h-[74px] w-[74px] items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.authGlow }}
                >
                  <View
                    className="h-[58px] w-[58px] items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.primaryForeground }}
                  >
                    <Image className="h-8 w-8" resizeMode="contain" source={pataspaceLogo} />
                  </View>
                </View>

                <View className="items-center gap-2">
                  <Text className="text-[11px] font-semibold uppercase tracking-[2.6px] text-muted-foreground">
                    {eyebrow}
                  </Text>
                  <Text className="text-center text-[31px] font-semibold tracking-[-0.9px] text-foreground">
                    {title}
                  </Text>
                  <Text className="max-w-[310px] text-center text-[14px] leading-6 text-muted-foreground">
                    {description}
                  </Text>
                </View>
              </View>

              <View className="mt-6 gap-4">{children}</View>
              {footer ? <View className="mt-6">{footer}</View> : null}
            </View>
          </MotionView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function AuthField({
  label,
  icon,
  className,
  rightIcon,
  onRightPress,
  ...props
}: TextInputProps & {
  label: string;
  icon: IconName;
  className?: string;
  rightIcon?: IconName;
  onRightPress?: () => void;
}) {
  const { theme } = useMobileApp();

  return (
    <View className={cn('gap-2.5', className)}>
      <Text className="text-[14px] font-medium text-foreground">{label}</Text>
      <View
        className="min-h-14 flex-row items-center rounded-[18px] border px-4"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        <AppIcon name={icon} size={18} />
        <TextInput
          className="ml-3 flex-1 py-4 text-[15px] text-foreground"
          placeholderTextColor={theme.inputPlaceholder}
          {...props}
        />
        {rightIcon ? (
          <Pressable className="pl-3 active:opacity-70" hitSlop={8} onPress={onRightPress}>
            <AppIcon name={rightIcon} size={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AuthError({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return <Text className="text-sm font-medium text-danger">{message}</Text>;
}

function AuthFooterLink({
  question,
  action,
  onPress,
}: {
  question: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center justify-center gap-1" onPress={onPress}>
      <Text className="text-sm text-muted-foreground">{question}</Text>
      <Text className="text-sm font-semibold text-foreground">{action}</Text>
    </Pressable>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhoneForMetadata(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `+254${digits}`;
  }

  return phone.trim();
}

function getClerkErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const apiErrors = (error as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
  const firstError = Array.isArray(apiErrors) ? apiErrors[0] : null;

  if (firstError?.longMessage) {
    return firstError.longMessage;
  }

  if (firstError?.message) {
    return firstError.message;
  }

  const message = (error as { message?: string }).message;

  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function WelcomeScreen() {
  return (
    <AuthShell
      eyebrow="Verified housing handovers"
      title="Move smart. Move fast."
      description="Browse verified exits, unlock direct contacts, and manage every move in one clean flow."
      footer={
        <Link href={appRoutes.onboarding} asChild>
          <Pressable>
            <Text className="text-center text-sm font-medium text-muted-foreground">
              See how it works
            </Text>
          </Pressable>
        </Link>
      }
    >
      <View className="rounded-[24px] border border-border bg-secondary px-5 py-5">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-muted-foreground">
          Mobile-first verification
        </Text>
        <Text className="mt-3 text-[21px] font-semibold tracking-[-0.6px] text-foreground">
          Capture proof, unlock only when ready, and keep every listing handover documented.
        </Text>
      </View>

      <Link href={appRoutes.register} asChild>
        <Button className="min-h-14 rounded-[18px]" label="Create account" />
      </Link>

      <Link href={appRoutes.login} asChild>
        <Button className="min-h-14 rounded-[18px]" label="Log in" variant="secondary" />
      </Link>
    </AuthShell>
  );
}

export function OnboardingScreen() {
  const [slideIndex, setSlideIndex] = useState(0);
  const { onboardingSlides } = useMobileApp();
  const router = useRouter();
  const slide = onboardingSlides[slideIndex];
  const lastSlide = slideIndex === onboardingSlides.length - 1;

  return (
    <AuthShell
      eyebrow={`Step ${slideIndex + 1} of ${onboardingSlides.length}`}
      title={slide.title}
      description={slide.description}
      footer={
        <View className="flex-row gap-3">
          <Button
            className="flex-1 min-h-14 rounded-[18px]"
            label={slideIndex === 0 ? 'Skip' : 'Back'}
            variant="secondary"
            onPress={() => {
              if (slideIndex === 0) {
                router.replace(appRoutes.register);
                return;
              }

              setSlideIndex((current) => current - 1);
            }}
          />
          <Button
            className="flex-1 min-h-14 rounded-[18px]"
            label={lastSlide ? 'Sign up' : 'Next'}
            onPress={() => {
              if (lastSlide) {
                router.replace(appRoutes.register);
                return;
              }

              setSlideIndex((current) => current + 1);
            }}
          />
        </View>
      }
    >
      <View className="gap-5 rounded-[24px] border border-border bg-secondary p-5">
        <View className="flex-row items-center justify-center gap-2">
          {onboardingSlides.map((item, index) => (
            <View
              key={item.id}
              className={cn(
                'h-2.5 rounded-full',
                index === slideIndex ? 'w-10 bg-primary' : 'w-2.5 bg-border',
              )}
            />
          ))}
        </View>

        <Text className="text-[20px] font-semibold tracking-[-0.5px] text-foreground">
          {slide.description}
        </Text>
      </View>
    </AuthShell>
  );
}

export function RegisterScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!signUp || isSignedIn || signUp.status === 'complete') {
    return null;
  }

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join PataSpace"
      description="Use Clerk email sign-up for access, then keep your Kenyan number attached to your profile for marketplace activity."
      footer={
        <AuthFooterLink
          action="Log in"
          onPress={() => router.replace(appRoutes.login)}
          question="Already have an account?"
        />
      }
    >
      <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
        <Text className="text-sm leading-6 text-muted-foreground">
          Your email handles authentication. Your Kenyan phone number is saved with the account metadata for tenant workflows.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <AuthField
          className="flex-1"
          autoCapitalize="words"
          icon="person-outline"
          label="First name"
          onChangeText={setFirstName}
          placeholder="Amina"
          value={firstName}
        />
        <AuthField
          className="flex-1"
          autoCapitalize="words"
          icon="person-outline"
          label="Last name"
          onChangeText={setLastName}
          placeholder="Kamau"
          value={lastName}
        />
      </View>

      <AuthField
        autoCapitalize="none"
        icon="call-outline"
        keyboardType="phone-pad"
        label="Phone number"
        onChangeText={setPhone}
        placeholder="0712345678"
        value={phone}
      />

      <AuthField
        autoCapitalize="none"
        icon="mail-outline"
        keyboardType="email-address"
        label="Email address"
        onChangeText={setEmailAddress}
        placeholder="name@example.com"
        value={emailAddress}
      />

      <AuthField
        icon="lock-closed-outline"
        label="Password"
        onChangeText={setPassword}
        placeholder="Create a password"
        rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showPassword}
        value={password}
        onRightPress={() => setShowPassword((current) => !current)}
      />

      <AuthField
        icon="lock-closed-outline"
        label="Confirm password"
        onChangeText={setConfirmPassword}
        placeholder="Repeat your password"
        rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showConfirmPassword}
        value={confirmPassword}
        onRightPress={() => setShowConfirmPassword((current) => !current)}
      />

      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label={fetchStatus === 'fetching' ? 'Creating account...' : 'Create account'}
        onPress={async () => {
          if (!firstName.trim() || !lastName.trim()) {
            setError('Enter your full name.');
            return;
          }

          if (phone.replace(/\D/g, '').length < 10) {
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
        }}
        disabled={fetchStatus === 'fetching'}
      />

      <View nativeID="clerk-captcha" />
    </AuthShell>
  );
}

export function VerifyOtpScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  if (!signUp || isSignedIn || signUp.status === 'complete') {
    return null;
  }

  const awaitingEmailVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  if (!awaitingEmailVerification) {
    return (
      <AuthShell
        eyebrow="Complete registration"
        title="Start your sign-up again"
        description="There is no pending Clerk email verification in progress for this device right now."
        footer={
          <Pressable
            onPress={async () => {
              await signUp.reset();
              router.replace(appRoutes.register);
            }}
          >
            <Text className="text-center text-sm font-semibold text-foreground">Back to sign up</Text>
          </Pressable>
        }
      >
        <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
          <Text className="text-sm leading-6 text-muted-foreground">
            Create an account first, then Clerk will send a verification code to your email address.
          </Text>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Secure sign-up"
      title="Verify your email"
      description={`Enter the code Clerk sent to ${signUp.emailAddress ?? 'your email address'}.`}
      footer={
        <View className="items-center gap-4">
          <Pressable
            onPress={async () => {
              const { error: resendError } = await signUp.verifications.sendEmailCode();

              if (resendError) {
                setError(getClerkErrorMessage(resendError, 'Could not resend the verification code.'));
                setNotice('');
                return;
              }

              setError('');
              setNotice('Code sent again.');
            }}
          >
            <Text className="text-sm font-semibold text-foreground">Resend code</Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await signUp.reset();
              router.replace(appRoutes.register);
            }}
          >
            <Text className="text-sm text-muted-foreground">Change email</Text>
          </Pressable>
        </View>
      }
    >
      <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
        <Text className="text-sm leading-6 text-muted-foreground">
          Verification keeps listings, credits, unlock activity, and support history attached to the right account.
        </Text>
      </View>

      <AuthField
        autoFocus
        icon="key-outline"
        keyboardType="number-pad"
        label="Email verification code"
        onChangeText={setOtp}
        placeholder="Enter code"
        value={otp}
      />

      {notice ? <Text className="text-sm font-medium text-muted-foreground">{notice}</Text> : null}
      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label={fetchStatus === 'fetching' ? 'Verifying...' : 'Verify and continue'}
        onPress={async () => {
          if (!otp.trim()) {
            setError('Enter the code to continue.');
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
        }}
        disabled={fetchStatus === 'fetching'}
      />
    </AuthShell>
  );
}

export function LoginScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  if (!signIn) {
    return null;
  }

  async function finalizeSignIn() {
    const { error: finalizeError } = await signIn.finalize();

    if (finalizeError) {
      setError(getClerkErrorMessage(finalizeError, 'Could not finish signing you in.'));
      return false;
    }

    router.replace(appRoutes.home);

    return true;
  }

  async function submitLogin() {
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

  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthShell
        eyebrow="Confirm this device"
        title="Verify your sign-in"
        description={`Enter the code Clerk sent to ${
          typeof signIn.identifier === 'string' && signIn.identifier.trim()
            ? signIn.identifier
            : emailAddress || 'your email address'
        }.`}
        footer={
          <View className="items-center gap-4">
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
              <Text className="text-sm font-semibold text-foreground">Resend code</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await signIn.reset();
                setCode('');
                setError('');
                setNotice('');
              }}
            >
              <Text className="text-sm text-muted-foreground">Start over</Text>
            </Pressable>
          </View>
        }
      >
        <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
          <Text className="text-sm leading-6 text-muted-foreground">
            Clerk is asking for an email code to trust this device before opening the tenant workspace.
          </Text>
        </View>

        <AuthField
          autoFocus
          icon="key-outline"
          keyboardType="number-pad"
          label="Verification code"
          onChangeText={setCode}
          placeholder="Enter code"
          value={code}
        />

        {notice ? <Text className="text-sm font-medium text-muted-foreground">{notice}</Text> : null}
        <AuthError message={error} />

        <Button
          className="min-h-14 rounded-[18px]"
          label={fetchStatus === 'fetching' ? 'Verifying...' : 'Verify and continue'}
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
          disabled={fetchStatus === 'fetching'}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your account"
      description="Use the same Clerk account across mobile browsing, wallet activity, unlocks, confirmations, and support."
      footer={
        <AuthFooterLink
          action="Sign up"
          onPress={() => router.replace(appRoutes.register)}
          question="Don't have an account?"
        />
      }
    >
      <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
        <Text className="text-sm leading-6 text-muted-foreground">
          Mobile now uses Clerk authentication, matching the new web sign-in flow.
        </Text>
      </View>

      <AuthField
        autoCapitalize="none"
        icon="mail-outline"
        keyboardType="email-address"
        label="Email address"
        onChangeText={setEmailAddress}
        placeholder="name@example.com"
        value={emailAddress}
      />

      <AuthField
        icon="lock-closed-outline"
        label="Password"
        onChangeText={setPassword}
        placeholder="Enter password"
        rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showPassword}
        value={password}
        onRightPress={() => setShowPassword((current) => !current)}
      />

      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label={fetchStatus === 'fetching' ? 'Logging in...' : 'Log in'}
        onPress={submitLogin}
        disabled={fetchStatus === 'fetching'}
      />
    </AuthShell>
  );
}

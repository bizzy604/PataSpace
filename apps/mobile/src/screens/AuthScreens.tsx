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
type LoginMode = 'phone' | 'email';
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

function SocialButton({
  provider,
}: {
  provider: 'google' | 'apple' | 'x';
}) {
  const { theme } = useMobileApp();

  return (
    <Pressable
      className="h-12 w-12 items-center justify-center rounded-full border active:opacity-85"
      disabled
      style={{
        backgroundColor: theme.mode === 'dark' ? theme.surfaceSubtle : theme.surfaceSubtle,
        borderColor: theme.border,
      }}
    >
      {provider === 'x' ? (
        <Text className="text-[18px] font-semibold text-foreground">X</Text>
      ) : (
        <AppIcon
          color={
            provider === 'google'
              ? '#4285F4'
              : theme.mode === 'dark'
                ? theme.primaryForeground
                : theme.foreground
          }
          name={provider === 'google' ? 'logo-google' : 'logo-apple'}
          size={18}
        />
      )}
    </Pressable>
  );
}

function SocialRow() {
  return (
    <View className="items-center gap-4">
      <View className="flex-row items-center justify-center gap-3">
        <SocialButton provider="google" />
        <SocialButton provider="apple" />
        <SocialButton provider="x" />
      </View>
    </View>
  );
}

function DividerLabel({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

function AuthTabs({
  active,
  onChange,
}: {
  active: LoginMode;
  onChange: (mode: LoginMode) => void;
}) {
  return (
    <View className="flex-row rounded-[18px] border border-border bg-background p-1">
      {([
        ['email', 'Mail'],
        ['phone', 'Phone number'],
      ] as const).map(([mode, label]) => {
        const selected = active === mode;

        return (
          <Pressable
            key={mode}
            className={cn(
              'min-h-12 flex-1 items-center justify-center rounded-[14px] px-3',
              selected ? 'bg-secondary' : 'bg-transparent',
            )}
            onPress={() => onChange(mode)}
          >
            <Text
              className={cn(
                'text-sm font-semibold',
                selected ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
  const [firstName, setFirstName] = useState('Amina');
  const [lastName, setLastName] = useState('Kamau');
  const [phone, setPhone] = useState('0712345678');
  const [pin, setPin] = useState('1234');
  const [confirmPin, setConfirmPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const { beginRegistration } = useMobileApp();
  const router = useRouter();

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join PataSpace"
      description="Start with your Kenyan phone number, secure your PIN, and keep every move under one profile."
      footer={
        <AuthFooterLink
          action="Log in"
          onPress={() => router.replace(appRoutes.login)}
          question="Already have an account?"
        />
      }
    >
      <SocialRow />
      <DividerLabel label="or" />

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
        icon="lock-closed-outline"
        keyboardType="number-pad"
        label="PIN"
        onChangeText={setPin}
        placeholder="1234"
        rightIcon={showPin ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showPin}
        value={pin}
        onRightPress={() => setShowPin((current) => !current)}
      />

      <AuthField
        icon="lock-closed-outline"
        keyboardType="number-pad"
        label="Confirm PIN"
        onChangeText={setConfirmPin}
        placeholder="1234"
        rightIcon={showConfirmPin ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showConfirmPin}
        value={confirmPin}
        onRightPress={() => setShowConfirmPin((current) => !current)}
      />

      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Create account"
        onPress={() => {
          const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

          if (!firstName.trim() || !lastName.trim()) {
            setError('Enter your full name.');
            return;
          }

          if (phone.replace(/\D/g, '').length < 10) {
            setError('Enter a valid Kenyan phone number.');
            return;
          }

          if (pin.trim().length < 4) {
            setError('Use a 4-digit PIN or longer.');
            return;
          }

          if (pin !== confirmPin) {
            setError('PINs do not match.');
            return;
          }

          setError('');
          beginRegistration(fullName, phone);
          router.push(appRoutes.verifyOtp);
        }}
      />
    </AuthShell>
  );
}

export function VerifyOtpScreen() {
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { beginRegistration, pendingAuth, verifyOtp } = useMobileApp();
  const router = useRouter();

  return (
    <AuthShell
      eyebrow="Secure sign-in"
      title="Verify your phone"
      description={`Enter the code sent to ${pendingAuth?.phone ?? 'your phone number'}.`}
      footer={
        <View className="items-center gap-4">
          <Pressable
            onPress={() => {
              if (!pendingAuth) {
                setError('Start with sign up or login first.');
                setNotice('');
                return;
              }

              beginRegistration(pendingAuth.name, pendingAuth.phone);
              setError('');
              setNotice('Code sent again.');
            }}
          >
            <Text className="text-sm font-semibold text-foreground">Resend code</Text>
          </Pressable>

          <Pressable onPress={() => router.replace(appRoutes.register)}>
            <Text className="text-sm text-muted-foreground">Change number</Text>
          </Pressable>
        </View>
      }
    >
      <View className="rounded-[22px] border border-border bg-secondary px-4 py-4">
        <Text className="text-sm leading-6 text-muted-foreground">
          Verification keeps listings, credits, and unlock activity tied to the right account.
        </Text>
      </View>

      <AuthField
        autoFocus
        icon="key-outline"
        keyboardType="number-pad"
        label="Verification code"
        onChangeText={setOtp}
        placeholder="123456"
        value={otp}
      />

      {notice ? <Text className="text-sm font-medium text-muted-foreground">{notice}</Text> : null}
      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Verify and continue"
        onPress={() => {
          if (!verifyOtp(otp)) {
            setError('Enter the code to continue.');
            setNotice('');
            return;
          }

          setError('');
          router.replace(appRoutes.home);
        }}
      />
    </AuthShell>
  );
}

export function LoginScreen() {
  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('0712345678');
  const [email, setEmail] = useState('amina@pataspace.co.ke');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const { beginRegistration, login } = useMobileApp();
  const router = useRouter();

  function submitLogin() {
    if (loginMode === 'phone') {
      if (phone.replace(/\D/g, '').length < 10 || pin.trim().length < 4) {
        setError('Enter a valid phone number and PIN.');
        return;
      }

      setError('');
      login(phone);
      router.replace(appRoutes.home);
      return;
    }

    if (!isValidEmail(email) || pin.trim().length < 4) {
      setError('Enter a valid email address and PIN.');
      return;
    }

    setError('');
    login(email);
    router.replace(appRoutes.home);
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your account"
      description="Pick up saved homes, unlock history, and your last verified actions without starting over."
      footer={
        <AuthFooterLink
          action="Sign up"
          onPress={() => router.replace(appRoutes.register)}
          question="Don't have an account?"
        />
      }
    >
      <SocialRow />
      <DividerLabel label="or" />
      <AuthTabs active={loginMode} onChange={setLoginMode} />

      <AuthField
        autoCapitalize="none"
        icon={loginMode === 'phone' ? 'call-outline' : 'mail-outline'}
        keyboardType={loginMode === 'phone' ? 'phone-pad' : 'email-address'}
        label={loginMode === 'phone' ? 'Phone number' : 'Email'}
        onChangeText={loginMode === 'phone' ? setPhone : setEmail}
        placeholder={loginMode === 'phone' ? '0712345678' : 'name@example.com'}
        value={loginMode === 'phone' ? phone : email}
      />

      <AuthField
        icon="lock-closed-outline"
        keyboardType="number-pad"
        label="PIN"
        onChangeText={setPin}
        placeholder="1234"
        rightIcon={showPin ? 'eye-outline' : 'eye-off-outline'}
        secureTextEntry={!showPin}
        value={pin}
        onRightPress={() => setShowPin((current) => !current)}
      />

      <View className="items-end">
        <Pressable
          onPress={() => {
            if (loginMode !== 'phone') {
              setError('Switch to phone login to reset your PIN.');
              return;
            }

            if (phone.replace(/\D/g, '').length < 10) {
              setError('Enter your phone number first.');
              return;
            }

            setError('');
            beginRegistration('PataSpace User', phone);
            router.push(appRoutes.verifyOtp);
          }}
        >
          <Text className="text-sm font-semibold text-foreground">
            {loginMode === 'phone' ? 'Forgot PIN?' : 'Use phone to reset PIN'}
          </Text>
        </Pressable>
      </View>

      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Log in"
        onPress={submitLogin}
      />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Face or fingerprint login"
        variant="secondary"
        onPress={submitLogin}
      />
    </AuthShell>
  );
}

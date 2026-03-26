import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { appleHIGTokens } from '@pataspace/design-tokens';
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
import { Screen } from '@/components/ui/screen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';
import { appRoutes } from '@/lib/routes';

type IconName = ComponentProps<typeof AppIcon>['name'];
const pataspaceLogo = require('../../assets/PataSpace Logo.png');

function AuthShell({
  title,
  description,
  children,
  footer,
  showBack = false,
  onBackPress,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
}) {
  const router = useRouter();

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, paddingTop: 10, paddingBottom: 24 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 overflow-hidden">
          <View className="absolute inset-0" pointerEvents="none">
            <View className="absolute -left-20 top-28 h-64 w-64 rounded-full bg-primary/10" />
            <View className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#252525]/[0.05]" />
            <View className="absolute right-8 top-36 h-24 w-24 rounded-[30px] border border-primary/10 bg-primary/5" />
            <View className="absolute left-10 bottom-28 h-16 w-16 rounded-[22px] bg-[#252525]/[0.04]" />
          </View>

          <View className="min-h-12">
            {showBack ? (
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-card active:opacity-90"
                onPress={onBackPress ?? (() => router.back())}
              >
                <AppIcon name="arrow-back-outline" size={20} />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-1 justify-center">
            <View className="gap-8">
              <View className="items-center gap-4 px-3">
                <View className="h-24 w-24 items-center justify-center rounded-[30px] border border-border bg-card/95 p-4 shadow-card">
                  <Image className="h-full w-full" resizeMode="contain" source={pataspaceLogo} />
                </View>
                <Text className="text-center text-[14px] font-semibold uppercase tracking-[2.6px] text-primary">
                  PataSpace
                </Text>
                <Text className="text-center text-[34px] font-semibold uppercase leading-[40px] tracking-[-1.1px] text-foreground">
                  {title}
                </Text>
                <Text className="max-w-[320px] text-center text-[15px] leading-6 text-muted-foreground">
                  {description}
                </Text>
              </View>

              <View className="gap-4">{children}</View>
            </View>
          </View>

          {footer ? <View className="pt-6">{footer}</View> : null}
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
  return (
    <View className={cn('gap-2.5', className)}>
      <Text className="text-[15px] font-medium text-foreground">{label}</Text>
      <View className="min-h-14 flex-row items-center rounded-[18px] border border-border bg-surface px-4">
        <AppIcon name={icon} size={18} />
        <TextInput
          className="ml-3 flex-1 py-4 text-[15px] text-foreground"
          placeholderTextColor={appleHIGTokens.color.text.secondary}
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

function AuthCheckbox({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-row items-center gap-2 active:opacity-80" onPress={onPress}>
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-[6px] border',
          checked ? 'border-primary bg-primary' : 'border-border bg-card',
        )}
      >
        {checked ? <AppIcon name="checkmark" size={12} inverse /> : null}
      </View>
      <Text className="text-sm text-muted-foreground">{label}</Text>
    </Pressable>
  );
}

function AuthError({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return <Text className="text-sm font-medium text-primary">{message}</Text>;
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
      <Text className="text-sm font-semibold text-primary">{action}</Text>
    </Pressable>
  );
}

export function WelcomeScreen() {
  return (
    <AuthShell
      title={'MOVE SMART.\nMOVE FAST.'}
      description="Verified housing moves, direct connections, and proof-led listing capture."
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
      <View className="rounded-[28px] border border-border bg-secondary p-6">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">
          Mobile-first housing handover
        </Text>
        <Text className="mt-3 text-[23px] font-semibold tracking-[-0.7px] text-foreground">
          Post a place, browse listings, unlock only when you are ready.
        </Text>
      </View>

      <Link href={appRoutes.register} asChild>
        <Button className="min-h-14 rounded-[18px]" label="Sign Up" />
      </Link>

      <Link href={appRoutes.login} asChild>
        <Button className="min-h-14 rounded-[18px]" variant="outline" label="Login" />
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
      title={slide.title.toUpperCase()}
      description={slide.description}
      showBack
      onBackPress={() => router.replace(appRoutes.home)}
      footer={
        <View className="flex-row gap-3">
          <Button
            className="flex-1 min-h-14 rounded-[18px]"
            variant="outline"
            label={slideIndex === 0 ? 'Skip' : 'Back'}
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
            label={lastSlide ? 'Sign Up' : 'Next'}
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
      <View className="gap-5 rounded-[30px] border border-border bg-card p-6 shadow-card">
        <View className="flex-row items-center justify-center gap-2">
          {onboardingSlides.map((item, index) => (
            <View
              key={item.id}
              className={cn(
                'h-2.5 rounded-full',
                index === slideIndex ? 'w-8 bg-primary' : 'w-2.5 bg-border',
              )}
            />
          ))}
        </View>

        <View className="rounded-[24px] bg-secondary px-5 py-6">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">
            Step {slideIndex + 1}
          </Text>
          <Text className="mt-3 text-[22px] font-semibold tracking-[-0.6px] text-foreground">
            {slide.title}
          </Text>
          <Text className="mt-3 text-[15px] leading-6 text-muted-foreground">
            {slide.description}
          </Text>
        </View>
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
      title="SIGN UP"
      description="Create your account and continue."
      showBack
      onBackPress={() => router.replace('/')}
      footer={
        <AuthFooterLink
          question="Already have an account?"
          action="Login"
          onPress={() => router.replace(appRoutes.login)}
        />
      }
    >
      <View className="flex-row gap-3">
        <AuthField
          className="flex-1"
          autoCapitalize="words"
          icon="person-outline"
          label="First Name"
          onChangeText={setFirstName}
          placeholder="Amina"
          value={firstName}
        />
        <AuthField
          className="flex-1"
          autoCapitalize="words"
          icon="person-outline"
          label="Last Name"
          onChangeText={setLastName}
          placeholder="Kamau"
          value={lastName}
        />
      </View>

      <AuthField
        autoCapitalize="none"
        icon="call-outline"
        keyboardType="phone-pad"
        label="Phone Number"
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
        label="Sign Up"
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
      title={'VERIFY\nYOUR PHONE'}
      description={`Code sent to ${pendingAuth?.phone ?? 'your phone number'}.`}
      showBack
      onBackPress={() => router.replace(appRoutes.register)}
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
            <Text className="text-sm font-semibold text-primary">Resend code</Text>
          </Pressable>

          <Pressable onPress={() => router.replace(appRoutes.register)}>
            <Text className="text-sm text-muted-foreground">Change number</Text>
          </Pressable>
        </View>
      }
    >
      <AuthField
        autoFocus
        icon="key-outline"
        keyboardType="number-pad"
        label="Verification Code"
        onChangeText={setOtp}
        placeholder="123456"
        value={otp}
      />

      {notice ? <Text className="text-sm font-medium text-muted-foreground">{notice}</Text> : null}
      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Verify"
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
  const [phone, setPhone] = useState('0712345678');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const { beginRegistration, login } = useMobileApp();
  const router = useRouter();

  return (
    <AuthShell
      title={'LOGIN TO\nYOUR ACCOUNT'}
      description="Access your account and continue."
      footer={
        <AuthFooterLink
          question="Don't have an account?"
          action="Sign Up"
          onPress={() => router.replace(appRoutes.register)}
        />
      }
    >
      <AuthField
        autoCapitalize="none"
        icon="call-outline"
        keyboardType="phone-pad"
        label="Phone Number"
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

      <View className="flex-row items-center justify-between gap-3">
        <AuthCheckbox
          checked={rememberMe}
          label="Remember me"
          onPress={() => setRememberMe((current) => !current)}
        />

        <Pressable
          onPress={() => {
            if (phone.replace(/\D/g, '').length < 10) {
              setError('Enter your phone number first.');
              return;
            }

            setError('');
            beginRegistration('PataSpace User', phone);
            router.push(appRoutes.verifyOtp);
          }}
        >
          <Text className="text-sm font-semibold text-primary">Forgot PIN?</Text>
        </Pressable>
      </View>

      <AuthError message={error} />

      <Button
        className="min-h-14 rounded-[18px]"
        label="Login"
        onPress={() => {
          if (phone.replace(/\D/g, '').length < 10 || pin.trim().length < 4) {
            setError('Enter a valid phone number and PIN.');
            return;
          }

          setError('');
          login(phone);
          router.replace(appRoutes.home);
        }}
      />
    </AuthShell>
  );
}

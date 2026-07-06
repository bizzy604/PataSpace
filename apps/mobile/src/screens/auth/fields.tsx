/**
 * Purpose: Auth-specific composite inputs the base Input primitive doesn't
 *   cover — a +254 phone field, a password field with a show/hide eye, and the
 *   6-box OTP code input. All share the DESIGN.md filled look (#EDEDED, 12px,
 *   2pt teal focus border).
 * Why important: Register, login, and verify screens reuse these; keeping them
 *   here avoids duplicating the styled-field boilerplate per screen.
 * Used by: screens/auth/{Register,Login,VerifyOtp}Screen.
 */
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="font-body-bold text-label-md uppercase tracking-[1px] text-muted-foreground">
      {children}
    </Text>
  );
}

const fieldShell =
  'min-h-12 flex-row items-center rounded-[12px] border-2 bg-surface-subtle px-4';

export function PhoneField({
  label = 'Phone number',
  value,
  onChangeText,
  placeholder = '712 345 678',
  invalid = false,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const { theme } = useMobileApp();
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <View
        className={cn(
          fieldShell,
          invalid ? 'border-danger' : focused ? 'border-primary' : 'border-transparent',
        )}
      >
        <Text className="font-body-medium text-body-lg text-foreground">+254</Text>
        <View className="mx-3 h-6 w-px bg-outline-variant" />
        <TextInput
          className="flex-1 py-3 font-body text-body-lg text-foreground"
          keyboardType="phone-pad"
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export function PasswordField({
  label = 'Password',
  value,
  onChangeText,
  placeholder = 'Create a secure password',
  invalid = false,
  ...props
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
} & Pick<TextInputProps, 'autoFocus' | 'textContentType'>) {
  const { theme } = useMobileApp();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <View
        className={cn(
          fieldShell,
          invalid ? 'border-danger' : focused ? 'border-primary' : 'border-transparent',
        )}
      >
        <TextInput
          className="flex-1 py-3 font-body text-body-lg text-foreground"
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <Pressable
          className="pl-3 active:opacity-70"
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <AppIcon name={visible ? 'eye-outline' : 'eye-off-outline'} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

/** Six-box verification code input backed by one hidden TextInput. */
export function OtpInput({
  value,
  onChangeText,
  length = 6,
  autoFocus = true,
}: {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split('').slice(0, length);

  return (
    <Pressable className="flex-row justify-between" onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, index) => {
        const active = focused && index === Math.min(digits.length, length - 1);
        const filled = index < digits.length;
        return (
          <View
            key={index}
            className={cn(
              'h-14 w-12 items-center justify-center rounded-[12px] border-2 bg-surface-subtle',
              active ? 'border-primary' : filled ? 'border-outline-variant' : 'border-transparent',
            )}
          >
            <Text className="font-display text-headline-sm text-foreground">
              {digits[index] ?? ''}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        // Off-screen: captures input while the boxes render the value.
        className="absolute h-px w-px opacity-0"
        keyboardType="number-pad"
        maxLength={length}
        value={value}
        autoFocus={autoFocus}
        onChangeText={(next) => onChangeText(next.replace(/\D/g, ''))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Pressable>
  );
}

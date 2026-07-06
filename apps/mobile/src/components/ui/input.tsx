import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

type InputProps = TextInputProps & {
  className?: string;
  /** Optional caption label rendered above the field (DM Sans, 13pt). */
  label?: string;
  /** Wrapper class for the label + field group. */
  containerClassName?: string;
};

export function Input({
  className,
  label,
  containerClassName,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { theme } = useMobileApp();
  const [focused, setFocused] = useState(false);

  const field = (
    <TextInput
      className={cn(
        // Filled #EDEDED, 12px radius, 2pt teal border on focus (DESIGN.md).
        // Border stays 2pt/transparent when idle so focus adds no layout shift.
        'min-h-12 rounded-[12px] border-2 border-transparent bg-surface-subtle px-4 py-3 font-body text-body-lg text-foreground',
        focused && 'border-primary',
        className,
      )}
      placeholderTextColor={placeholderTextColor ?? theme.inputPlaceholder}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );

  if (!label) {
    return field;
  }

  return (
    <View className={cn('gap-2', containerClassName)}>
      <Text className="font-body-bold text-label-md text-muted-foreground">{label}</Text>
      {field}
    </View>
  );
}

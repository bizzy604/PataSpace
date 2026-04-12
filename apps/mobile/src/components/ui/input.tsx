import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

export function Input({
  className,
  placeholderTextColor,
  ...props
}: TextInputProps & { className?: string }) {
  const { theme } = useMobileApp();

  return (
    <TextInput
      className={cn(
        'min-h-12 rounded-[18px] border border-border bg-surface px-4 py-3 text-base text-foreground',
        className,
      )}
      placeholderTextColor={placeholderTextColor ?? theme.inputPlaceholder}
      {...props}
    />
  );
}

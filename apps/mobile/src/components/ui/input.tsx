import { TextInput, type TextInputProps } from 'react-native';
import { appleHIGTokens } from '@pataspace/design-tokens';
import { cn } from '@/lib/cn';

export function Input({
  className,
  placeholderTextColor = appleHIGTokens.color.text.secondary,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn(
        'min-h-12 rounded-[18px] border border-border bg-surface px-4 py-3 text-base text-foreground',
        className,
      )}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}

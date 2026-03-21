import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Input({ className, placeholderTextColor = '#78716c', ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn(
        'min-h-12 rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-stone-50',
        className,
      )}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
}

import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'items-center justify-center rounded-2xl px-4 py-3 active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-amber-400',
        secondary: 'bg-stone-800',
        outline: 'border border-stone-700 bg-transparent',
      },
      size: {
        default: 'min-h-12',
        sm: 'min-h-10 px-3 py-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-center font-bold tracking-[1px]', {
  variants: {
    variant: {
      default: 'text-stone-950',
      secondary: 'text-stone-50',
      outline: 'text-stone-100',
    },
    size: {
      default: 'text-sm uppercase',
      sm: 'text-xs uppercase',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label: string;
  };

export function Button({
  className,
  variant,
  size,
  label,
  ...props
}: ButtonProps) {
  return (
    <Pressable className={cn(buttonVariants({ variant, size }), className)} {...props}>
      <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
    </Pressable>
  );
}

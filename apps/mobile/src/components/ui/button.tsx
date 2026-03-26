import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'items-center justify-center rounded-[18px] border px-5 py-3 active:opacity-90',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary shadow-card',
        secondary: 'border-border bg-secondary',
        outline: 'border-border bg-card',
        dark: 'border-transparent bg-surface-inverse shadow-floating',
      },
      size: {
        default: 'min-h-12',
        sm: 'min-h-10 px-4 py-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-center font-semibold tracking-[-0.2px]', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-foreground',
      dark: 'text-primary-foreground',
    },
    size: {
      default: 'text-[15px]',
      sm: 'text-sm',
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

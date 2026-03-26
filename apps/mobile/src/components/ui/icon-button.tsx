import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const iconButtonVariants = cva(
  'h-12 w-12 items-center justify-center rounded-full border active:opacity-90',
  {
    variants: {
      variant: {
        accent: 'border-transparent bg-primary shadow-card',
        subtle: 'border-border bg-secondary',
        dark: 'border-transparent bg-surface-inverse shadow-floating',
      },
    },
    defaultVariants: {
      variant: 'subtle',
    },
  },
);

const iconButtonTextVariants = cva('text-sm font-semibold tracking-[0.2px]', {
  variants: {
    variant: {
      accent: 'text-primary-foreground',
      subtle: 'text-foreground',
      dark: 'text-primary-foreground',
    },
  },
  defaultVariants: {
    variant: 'subtle',
  },
});

type IconButtonProps = PressableProps &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
  };

export function IconButton({
  className,
  variant,
  label,
  ...props
}: IconButtonProps) {
  return (
    <Pressable className={cn(iconButtonVariants({ variant }), className)} {...props}>
      <Text className={iconButtonTextVariants({ variant })}>{label}</Text>
    </Pressable>
  );
}

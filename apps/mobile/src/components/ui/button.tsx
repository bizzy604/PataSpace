import { useRef } from 'react';
import { Animated, Pressable, Text, type PressableProps } from 'react-native';
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
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(value: number) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  }

  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), props.disabled ? 'opacity-60' : '', className)}
      onPressIn={(event) => {
        animateTo(0.985);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

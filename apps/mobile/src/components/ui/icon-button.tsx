import type { ComponentProps } from 'react';
import { useRef } from 'react';
import { Animated, Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';

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
    label?: string;
    icon?: ComponentProps<typeof AppIcon>['name'];
  };

export function IconButton({
  className,
  variant,
  label,
  icon,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const inverse = variant === 'accent' || variant === 'dark';
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
      className={cn(iconButtonVariants({ variant }), props.disabled ? 'opacity-60' : '', className)}
      onPressIn={(event) => {
        animateTo(0.94);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      {...props}
    >
      <Animated.View className="items-center justify-center" style={{ transform: [{ scale }] }}>
        {icon ? <AppIcon name={icon} inverse={inverse} size={18} /> : null}
        {label ? (
          <Text className={cn(iconButtonTextVariants({ variant }), icon ? 'mt-1 text-[11px]' : '')}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

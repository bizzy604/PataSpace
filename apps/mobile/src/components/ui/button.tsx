import { useRef } from 'react';
import { Animated, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import {
  buttonVariants,
  buttonTextVariants,
  type ButtonVariantProps,
} from '@/components/ui/variants/button-variants';

type ButtonProps = PressableProps &
  ButtonVariantProps & {
    label: string;
  };

export function Button({
  className,
  variant,
  size,
  shape,
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
      className={cn(
        buttonVariants({ variant, size, shape }),
        props.disabled ? 'opacity-60' : '',
        className,
      )}
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

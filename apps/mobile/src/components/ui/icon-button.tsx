import type { ComponentProps } from 'react';
import { useRef } from 'react';
import { Animated, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';
import {
  iconButtonVariants,
  iconButtonTextVariants,
  type IconButtonVariantProps,
} from '@/components/ui/variants/icon-button-variants';

type IconButtonProps = PressableProps &
  IconButtonVariantProps & {
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

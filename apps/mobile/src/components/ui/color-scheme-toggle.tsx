import { useEffect, useRef } from 'react';
import { Animated, Pressable, View, Text } from 'react-native';
import { AppIcon } from '@/components/ui/app-icon';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';

type ColorSchemeToggleProps = {
  className?: string;
  showLabels?: boolean;
};

export function ColorSchemeToggle({
  className,
  showLabels = false,
}: ColorSchemeToggleProps) {
  const { colorScheme, setColorSchemePreference, theme } = useMobileApp();
  const translateX = useRef(new Animated.Value(colorScheme === 'dark' ? 42 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: colorScheme === 'dark' ? 42 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [colorScheme, translateX]);

  return (
    <View className={cn('items-center gap-2', className)}>
      <View
        className="relative h-14 w-[98px] flex-row items-center overflow-hidden rounded-full border px-1.5"
        style={{
          backgroundColor: theme.toggleTrack,
          borderColor: theme.toggleBorder,
          shadowColor: theme.shadowColor,
          shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        }}
      >
        <Animated.View
          className="absolute left-1.5 top-1.5 h-10 w-10 rounded-full"
          style={{
            backgroundColor: theme.toggleThumb,
            transform: [{ translateX }],
          }}
        />
        <Pressable
          className="z-10 h-10 w-10 items-center justify-center"
          hitSlop={6}
          onPress={() => setColorSchemePreference('light')}
        >
          <AppIcon
            name="sunny"
            color={colorScheme === 'light' ? '#FFFFFF' : theme.mutedForeground}
            size={18}
          />
        </Pressable>
        <Pressable
          className="z-10 h-10 w-10 items-center justify-center"
          hitSlop={6}
          onPress={() => setColorSchemePreference('dark')}
        >
          <AppIcon
            name="moon"
            color={colorScheme === 'dark' ? '#FFFFFF' : theme.mutedForeground}
            size={18}
          />
        </Pressable>
      </View>

      {showLabels ? (
        <Text className="text-xs font-medium uppercase tracking-[1.4px] text-muted-foreground">
          {colorScheme === 'dark' ? 'Dark mode' : 'Light mode'}
        </Text>
      ) : null}
    </View>
  );
}

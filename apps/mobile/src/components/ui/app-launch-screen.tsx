import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

const pataspaceLogo = require('../../../assets/PataSpace Logo.png');

export function AppLaunchScreen() {
  const { theme } = useMobileApp();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const spinning = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    spinning.start();
    pulsing.start();

    return () => {
      spinning.stop();
      pulsing.stop();
    };
  }, [pulse, spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style={theme.statusBarStyle} />
      <View className="flex-1 items-center justify-center overflow-hidden px-6">
        <View
          className="absolute -top-20 h-56 w-56 rounded-full"
          style={{ backgroundColor: theme.authBackdropA }}
        />
        <View
          className="absolute bottom-20 right-[-40px] h-48 w-48 rounded-full"
          style={{ backgroundColor: theme.authBackdropB }}
        />

        <Animated.View
          style={{
            transform: [{ scale: pulse }],
          }}
        >
          <View
            className="h-28 w-28 items-center justify-center rounded-[32px] border bg-card"
            style={{
              borderColor: theme.border,
              shadowColor: theme.shadowColor,
              shadowOpacity: theme.mode === 'dark' ? 0.24 : 0.12,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 10,
            }}
          >
            <Image className="h-14 w-14" resizeMode="contain" source={pataspaceLogo} />
          </View>
        </Animated.View>

        <View className="mt-8 items-center gap-2">
          <Text className="text-[28px] font-semibold tracking-[-0.7px] text-foreground">
            PataSpace
          </Text>
          <Text className="max-w-[240px] text-center text-[14px] leading-6 text-muted-foreground">
            Verified housing handovers for faster, safer moves.
          </Text>
        </View>

        <View className="mt-10 h-20 w-20 items-center justify-center">
          <Animated.View
            className="absolute h-20 w-20 rounded-full border-[3px]"
            style={{
              borderTopColor: theme.primary,
              borderRightColor: 'transparent',
              borderBottomColor: theme.primary,
              borderLeftColor: 'transparent',
              transform: [{ rotate: rotation }],
            }}
          />
          <View
            className="h-6 w-6 rounded-full"
            style={{
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

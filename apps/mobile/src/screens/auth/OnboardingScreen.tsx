/**
 * Purpose: 3-page onboarding carousel — hero image, title, subtitle, progress
 *   dots, and Next (Get Started on the last page → register).
 * Why important: The designed first-run intro (Authentication/onboarding_carousel)
 *   that funnels new users into account creation.
 * Used by: app/onboarding.tsx.
 */
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { cn } from '@/lib/cn';
import { appRoutes } from '@/lib/routes';
import { AuthScreen } from './auth-shared';

// Logo-only hero: the stock photos never fit the frame across screen sizes,
// so the carousel leads with the brand mark instead (2026-07-16 decision).
const pataspaceLogo = require('../../../assets/PataSpace Logo.png');

export function OnboardingScreen() {
  const [slideIndex, setSlideIndex] = useState(0);
  const { onboardingSlides } = useMobileApp();
  const router = useRouter();
  const slide = onboardingSlides[slideIndex];
  const lastSlide = slideIndex === onboardingSlides.length - 1;

  function goNext() {
    if (lastSlide) {
      router.replace(appRoutes.register);
      return;
    }
    setSlideIndex((current) => current + 1);
  }

  return (
    <AuthScreen
      footer={
        <View className="gap-5">
          <View className="flex-row items-center justify-center gap-2">
            {onboardingSlides.map((item, index) => (
              <View
                key={item.id}
                className={cn(
                  'h-2 rounded-full',
                  index === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-surface-subtle',
                )}
              />
            ))}
          </View>
          <Button label={lastSlide ? 'Get Started' : 'Next'} onPress={goNext} />
        </View>
      }
    >
      <View className="flex-1">
        <View className="flex-row justify-end">
          <Pressable
            className="px-2 py-1 active:opacity-70"
            hitSlop={8}
            onPress={() => router.replace(appRoutes.register)}
          >
            <Text className="font-body-medium text-label-md text-muted-foreground">Skip</Text>
          </Pressable>
        </View>

        {/*
          The hero flexes to whatever height is left between the Skip row and
          the text block (min 200dp so it never collapses) and centers the
          logo. Dimensions via style, not className: css-interop drops class
          sizing on Image on web, rendering the source at natural size.
        */}
        <View className="mt-2 min-h-[200px] flex-1 items-center justify-center rounded-[16px] bg-surface-subtle">
          <Image
            style={{ height: 112, width: 112 }}
            resizeMode="contain"
            source={pataspaceLogo}
          />
        </View>

        <View className="mt-6 gap-3">
          <Text className="font-display text-headline-lg text-foreground">{slide.title}</Text>
          <Text className="font-body text-body-lg text-muted-foreground">{slide.description}</Text>
        </View>
      </View>
    </AuthScreen>
  );
}

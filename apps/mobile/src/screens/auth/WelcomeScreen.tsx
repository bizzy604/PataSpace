/**
 * Purpose: Dark splash / welcome hero — logo, tagline, and the two entry
 *   actions (Get Started → onboarding, I Have an Account → login).
 * Why important: The first interactive screen for a signed-out visitor
 *   (rendered by app/index.tsx). Matches Authentication/splash_screen.
 * Used by: app/index.tsx when not authenticated.
 */
import { Image, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import { appRoutes } from '@/lib/routes';
import { AuthScreen } from './auth-shared';

const pataspaceLogo = require('../../../assets/PataSpace Logo.png');

export function WelcomeScreen() {
  return (
    <AuthScreen
      dark
      contentClassName="items-center justify-center"
      footer={
        <View className="gap-3">
          <Link href={appRoutes.onboarding} asChild>
            <Button label="Get Started" />
          </Link>
          <Link href={appRoutes.login} asChild>
            <Pressable className="min-h-12 items-center justify-center rounded-[16px] border border-white/25 px-5 py-3 active:opacity-80">
              <Text className="font-display text-body-md text-white">I Have an Account</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <View className="items-center gap-6">
        <View className="h-[120px] w-[120px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.06]">
          <Image className="h-16 w-16" resizeMode="contain" source={pataspaceLogo} />
        </View>
        <View className="items-center gap-2">
          <Text className="font-display text-headline-lg text-white">PataSpace</Text>
          <Text className="font-body text-body-lg text-white/60">Find Housing 3X Faster</Text>
        </View>
      </View>
    </AuthScreen>
  );
}

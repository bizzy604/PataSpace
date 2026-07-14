import '../../global.css';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AppLaunchScreen } from '@/components/ui/app-launch-screen';
import { AuthSessionProvider, useAuthSession } from '@/features/auth/auth-provider';
import { MobileAppProvider, useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

const publicPaths = new Set<string>([
  appRoutes.home,
  appRoutes.onboarding,
  appRoutes.register,
  appRoutes.verifyOtp,
  appRoutes.login,
  appRoutes.forgotPassword,
  appRoutes.resetPassword,
]);

function RootNavigator() {
  const [showLaunch, setShowLaunch] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuthSession();
  const { theme } = useMobileApp();
  // Brand fonts. Family names here are the exact strings NativeWind emits for
  // the font-display / font-body* utilities in tailwind.config.js.
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLaunch(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const isPublicPath = publicPaths.has(pathname);
    const isAuthOnlyPath = pathname !== appRoutes.home && publicPaths.has(pathname);

    if (!isSignedIn && !isPublicPath) {
      router.replace(appRoutes.login);
      return;
    }

    if (isSignedIn && isAuthOnlyPath) {
      router.replace(appRoutes.home);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  if (showLaunch || !isLoaded || !fontsLoaded) {
    return <AppLaunchScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <MobileAppProvider>
        <RootNavigator />
      </MobileAppProvider>
    </AuthSessionProvider>
  );
}

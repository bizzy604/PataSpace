import '../../global.css';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AppLaunchScreen } from '@/components/ui/app-launch-screen';
import { MobileAppProvider, useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

const publicPaths = new Set<string>([
  appRoutes.home,
  appRoutes.onboarding,
  appRoutes.register,
  appRoutes.verifyOtp,
  appRoutes.login,
  appRoutes.ssoCallback,
]);
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to apps/mobile/.env as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

function RootNavigator() {
  const [showLaunch, setShowLaunch] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { theme } = useMobileApp();

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

  if (showLaunch || !isLoaded) {
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
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <MobileAppProvider>
        <RootNavigator />
      </MobileAppProvider>
    </ClerkProvider>
  );
}

import '../../global.css';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AppLaunchScreen } from '@/components/ui/app-launch-screen';
import { MobileAppProvider, useMobileApp } from '@/features/mobile-app/mobile-app-provider';

const publicPaths = ['/', '/onboarding', '/register', '/verify-otp', '/login'];
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to apps/mobile/.env as EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

function RootNavigator() {
  const [showLaunch, setShowLaunch] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, theme } = useMobileApp();

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

    const isPublicPath = publicPaths.includes(pathname);
    const isAuthOnlyPath = pathname !== '/' && publicPaths.includes(pathname);

    if (!isSignedIn && !isPublicPath) {
      router.replace('/');
      return;
    }

    if (isSignedIn && isAuthOnlyPath) {
      router.replace('/');
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

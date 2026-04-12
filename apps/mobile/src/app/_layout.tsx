import '../../global.css';
import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { AppLaunchScreen } from '@/components/ui/app-launch-screen';
import { MobileAppProvider, useMobileApp } from '@/features/mobile-app/mobile-app-provider';

const publicPaths = ['/', '/onboarding', '/register', '/verify-otp', '/login'];

function RootNavigator() {
  const [showLaunch, setShowLaunch] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, theme } = useMobileApp();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLaunch(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const isPublicPath = publicPaths.includes(pathname);
    const isAuthOnlyPath = pathname !== '/' && publicPaths.includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/');
      return;
    }

    if (isAuthenticated && isAuthOnlyPath) {
      router.replace('/');
    }
  }, [isAuthenticated, pathname, router]);

  if (showLaunch) {
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
    <MobileAppProvider>
      <RootNavigator />
    </MobileAppProvider>
  );
}

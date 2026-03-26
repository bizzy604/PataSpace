import '../../global.css';
import { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { MobileAppProvider, useMobileApp } from '@/features/mobile-app/mobile-app-provider';

const publicPaths = ['/', '/onboarding', '/register', '/verify-otp', '/login'];

function RootNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useMobileApp();

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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#ffffff',
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

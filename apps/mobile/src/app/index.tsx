import { WelcomeScreen } from '@/screens/AuthScreens';
import { HomeScreen } from '@/screens/HomeScreen';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

export default function IndexRoute() {
  const { isAuthenticated } = useMobileApp();

  return isAuthenticated ? <HomeScreen /> : <WelcomeScreen />;
}

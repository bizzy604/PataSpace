/**
 * Purpose: The standard screen shell — safe area, status bar, an optional fixed
 * header, a keyboard-aware scroll body, and optional bottom bar / tab bar.
 * Why important: every non-auth screen renders inside this, so the keyboard
 * handling lives here rather than in each form. A field near the bottom of a
 * screen used to sit under the keyboard while the user typed blind; the scroll
 * body now lifts the focused field clear of it, on every screen at once.
 * Used by: every screen under src/screens except the auth flow, which uses the
 * equivalent AuthScreen shell in screens/auth/auth-shared.tsx.
 */
import type { ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { cn } from '@/lib/cn';
import { BottomNav } from '@/components/ui/bottom-nav';
import { KeyboardAwareScrollView } from '@/components/ui/keyboard-aware-scroll';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

type ScreenProps = ScrollViewProps & {
  className?: string;
  withTabBar?: boolean;
  bottomBar?: ReactNode;
  /** Fixed header rendered above the scroll area (e.g. the dark ScreenHeader). */
  header?: ReactNode;
};

export function Screen({
  className,
  contentContainerStyle,
  withTabBar = false,
  bottomBar,
  header,
  ...props
}: ScreenProps) {
  const { theme } = useMobileApp();
  const basePaddingBottom = bottomBar && withTabBar ? 18 : bottomBar || withTabBar ? 24 : 12;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <StatusBar style={theme.statusBarStyle} />
      <View className="flex-1 bg-background">
        {header}
        {/* The bottom bar and tab bar are siblings below this, so the scroll
            viewport it measures already ends above them. */}
        <KeyboardAwareScrollView
          className={cn('flex-1 bg-background', className)}
          contentContainerStyle={[
            { paddingHorizontal: 20, paddingTop: 12, paddingBottom: basePaddingBottom, gap: 18 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          {...props}
        />
        {bottomBar ? (
          <View className="border-t border-border bg-background px-5 pb-4 pt-4">
            {bottomBar}
          </View>
        ) : null}
        {withTabBar ? <BottomNav /> : null}
      </View>
    </SafeAreaView>
  );
}

import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { cn } from '@/lib/cn';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';

type ScreenProps = ScrollViewProps & {
  className?: string;
  withTabBar?: boolean;
  bottomBar?: ReactNode;
};

export function Screen({
  className,
  contentContainerStyle,
  withTabBar = false,
  bottomBar,
  ...props
}: ScreenProps) {
  const { theme } = useMobileApp();
  const basePaddingBottom = bottomBar && withTabBar ? 18 : bottomBar || withTabBar ? 24 : 12;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <StatusBar style={theme.statusBarStyle} />
      <View className="flex-1 bg-background">
        <ScrollView
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

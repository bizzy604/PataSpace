import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';
import { MotionView } from '@/components/ui/motion-view';

const navItems = [
  { href: '/', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { href: '/search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { href: '/create-listing', label: 'Post', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  { href: '/credits', label: 'Credits', icon: 'wallet-outline', activeIcon: 'wallet' },
  { href: '/profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <MotionView className="border-t border-border bg-background px-4 pb-2 pt-3" distance={18}>
      <View className="flex-row items-center gap-2 rounded-[24px] bg-surface-inverse p-2 shadow-floating">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable
                className={cn(
                  'min-h-14 flex-1 items-center justify-center rounded-[18px] px-2 py-2',
                  active ? 'bg-primary' : 'bg-transparent',
                )}
              >
                <AppIcon
                  name={active ? item.activeIcon : item.icon}
                  inverse={active}
                  active={false}
                  size={18}
                />
                <Text
                  className={cn(
                    'mt-1 text-[11px] font-semibold',
                    active ? 'text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </MotionView>
  );
}

import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Home', shortLabel: 'HM' },
  { href: '/browse', label: 'Browse', shortLabel: 'BR' },
  { href: '/create-listing', label: 'Post', shortLabel: '+' },
  { href: '/my-listings', label: 'Listings', shortLabel: 'LS' },
  { href: '/confirmations', label: 'Status', shortLabel: 'OK' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <View className="border-t border-border bg-background px-4 pb-2 pt-3">
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
                <Text
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[1.8px]',
                    active ? 'text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.shortLabel}
                </Text>
                <Text
                  className={cn(
                    'mt-1 text-xs font-semibold',
                    active ? 'text-primary-foreground' : 'text-primary-foreground',
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

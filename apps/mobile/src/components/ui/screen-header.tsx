/**
 * Purpose: The dark flow-screen top bar (Eerie Black shell, teal centered
 *   title, optional back chevron and one trailing action). Matches the header
 *   on the payment, contact, and transaction screens in the designs.
 * Why important: Several money/connection screens share this exact bar; one
 *   component keeps the shell colour, title style, and 44px touch targets
 *   identical and is passed to Screen's `header` slot so it stays fixed.
 * Used by: mpesa-processing, contact-revealed, transactions, transaction
 *   detail (Phase 3+).
 */
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/app-icon';

type ScreenHeaderProps = {
  title: string;
  /** Show a back chevron that pops the stack. Default true. */
  back?: boolean;
  onBack?: () => void;
  /** Optional trailing control (e.g. a share icon). */
  right?: ReactNode;
};

export function ScreenHeader({ title, back = true, onBack, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between bg-surface-inverse px-3 py-3">
      <View className="w-11">
        {back ? (
          <Pressable
            className="h-11 w-11 items-center justify-center active:opacity-70"
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-back" size={22} color="#28809A" />
          </Pressable>
        ) : null}
      </View>
      <Text className="flex-1 text-center font-display text-headline-sm text-primary-container">
        {title}
      </Text>
      <View className="w-11 items-end">{right}</View>
    </View>
  );
}

/** A trailing icon button sized for the ScreenHeader right slot. */
export function ScreenHeaderAction({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: ComponentProps<typeof AppIcon>['name'];
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      className="h-11 w-11 items-center justify-center active:opacity-70"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <AppIcon name={icon} size={22} color="#28809A" />
    </Pressable>
  );
}

/**
 * Purpose: Layer-3 bottom sheet overlay — dim backdrop, grabber handle, and a
 *   rounded-top panel that slides up. Used for filters, unlock confirmation,
 *   and payment-method selection.
 * Why important: DESIGN.md puts modal sheets on the topmost elevation layer;
 *   centralising the backdrop + handle + safe-area padding keeps every sheet
 *   consistent and dismissible.
 * Used by: filters, unlock, buy-credits (Phases 2-3).
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Disable tap-outside-to-dismiss for flows that must not be dropped. */
  dismissOnBackdrop?: boolean;
};

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  className,
  dismissOnBackdrop = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="absolute inset-0"
          onPress={dismissOnBackdrop ? onClose : undefined}
          accessibilityLabel="Close"
        />
        <View
          className={cn(
            'rounded-t-[24px] border-t border-border bg-surface-elevated px-5 pt-3 shadow-floating',
            className,
          )}
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="mb-3 h-1.5 w-10 self-center rounded-full bg-outline-variant" />
          {title ? (
            <Text className="mb-4 font-display text-headline-sm text-foreground">{title}</Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

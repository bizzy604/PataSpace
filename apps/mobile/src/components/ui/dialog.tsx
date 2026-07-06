/**
 * Purpose: Centered confirmation dialog — title, message, and up to two
 *   stacked actions. Used for logout, delete-account, insufficient-credits,
 *   and report-success modals.
 * Why important: These destructive/terminal confirmations must look and
 *   behave identically; one component owns the backdrop, card, and action
 *   layout so every screen calls the same thing.
 * Used by: settings, delete-account, unlock, report flows (Phases 3-6).
 */
import { Modal, Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { ButtonVariantProps } from '@/components/ui/variants/button-variants';

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariantProps['variant'];
  disabled?: boolean;
};

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirm: DialogAction;
  cancel?: DialogAction;
  className?: string;
};

export function Dialog({ visible, onClose, title, message, confirm, cancel, className }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Close" />
        <View
          className={cn(
            'w-full max-w-[380px] rounded-[16px] border border-border bg-surface-elevated p-6 shadow-floating',
            className,
          )}
        >
          <Text className="font-display text-headline-sm text-foreground">{title}</Text>
          {message ? (
            <Text className="mt-2 font-body text-body-md text-muted-foreground">{message}</Text>
          ) : null}
          <View className="mt-6 gap-3">
            <Button
              label={confirm.label}
              variant={confirm.variant ?? 'default'}
              disabled={confirm.disabled}
              onPress={confirm.onPress}
            />
            {cancel ? (
              <Button
                label={cancel.label}
                variant={cancel.variant ?? 'secondary'}
                disabled={cancel.disabled}
                onPress={cancel.onPress}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

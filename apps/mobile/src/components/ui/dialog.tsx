/**
 * Purpose: Centered confirmation dialog — title, message, and up to two
 *   stacked actions. Used for logout, delete-account, insufficient-credits,
 *   and report-success modals.
 * Why important: These destructive/terminal confirmations must look and
 *   behave identically; one component owns the backdrop, card, and action
 *   layout so every screen calls the same thing.
 * Used by: settings, delete-account, unlock, report flows (Phases 3-6).
 */
import type { ComponentProps, ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/cn';
import { AppIcon } from '@/components/ui/app-icon';
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
  message?: ReactNode;
  /** Optional icon rendered in a tinted circle above the title (centered). */
  icon?: ComponentProps<typeof AppIcon>['name'];
  /** Icon tint: 'primary' (default, teal) or 'danger' (red, for destructive). */
  tone?: 'primary' | 'danger';
  confirm: DialogAction;
  cancel?: DialogAction;
  className?: string;
};

export function Dialog({
  visible,
  onClose,
  title,
  message,
  icon,
  tone = 'primary',
  confirm,
  cancel,
  className,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Close" />
        <View
          className={cn(
            'w-full max-w-[380px] rounded-[16px] border border-border bg-surface-elevated p-6 shadow-floating',
            icon ? 'items-center' : '',
            className,
          )}
        >
          {icon ? (
            <View
              className={cn(
                'mb-4 h-16 w-16 items-center justify-center rounded-full',
                tone === 'danger' ? 'bg-danger/10' : 'bg-primary/10',
              )}
            >
              <AppIcon
                name={icon}
                size={28}
                active={tone !== 'danger'}
                color={tone === 'danger' ? '#FF3B30' : undefined}
              />
            </View>
          ) : null}
          <Text
            className={cn(
              'font-display text-headline-sm text-foreground',
              icon ? 'text-center' : '',
            )}
          >
            {title}
          </Text>
          {message ? (
            typeof message === 'string' ? (
              <Text
                className={cn(
                  'mt-2 font-body text-body-md text-muted-foreground',
                  icon ? 'text-center' : '',
                )}
              >
                {message}
              </Text>
            ) : (
              <View className={cn('mt-2', icon ? 'items-center' : '')}>{message}</View>
            )
          ) : null}
          <View className="mt-6 w-full gap-3">
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

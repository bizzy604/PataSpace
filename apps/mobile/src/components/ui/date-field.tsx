/**
 * Purpose: A tap-to-open date field. Renders like an Input, opens the platform
 * date picker, and stores one canonical YYYY-MM-DD value.
 * Why important: "Available from" was a free-text box, so every listing carried
 * a differently-shaped date and anything unparseable was silently replaced on
 * submit. A picker makes an invalid date unrepresentable rather than validated
 * after the fact, and the native dialog is the control people already know.
 * The date rules live in lib/listings/available-from.ts and are tested there.
 * Used by: screens/CreateListingFlowScreens.tsx (ListingDetailsFormScreen).
 */
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/cn';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { formatAvailableFrom, parseISODate, toISODate } from '@/lib/listings/available-from';

type DateFieldProps = {
  label: string;
  /** Canonical YYYY-MM-DD, or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Earliest selectable date; the picker greys out anything before it. */
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const { theme } = useMobileApp();
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const shown = formatAvailableFrom(value);

  /**
   * Android fires 'dismissed' for a cancelled dialog and closes itself, so the
   * cancel path must not write. iOS reports 'set' continuously as the spinner
   * moves, which is why it keeps its own Done button below rather than closing
   * on the first change.
   */
  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    onChange(toISODate(date));
  }

  return (
    <View className="gap-2">
      <Text className="font-body-bold text-label-md text-muted-foreground">{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={shown ? `${label}: ${shown}. Change date` : `${label}. Pick a date`}
        // Mirrors Input: filled surface, 12px radius, 2pt border reserved so
        // opening the picker adds no layout shift.
        className={cn(
          'min-h-12 flex-row items-center justify-between rounded-[12px] border-2 border-transparent bg-surface-subtle px-4 py-3 active:opacity-70',
          open && 'border-primary',
        )}
      >
        <Text
          className={cn(
            'font-body text-body-lg',
            shown ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {shown || placeholder}
        </Text>
        <AppIcon name="calendar-outline" size={20} active />
      </Pressable>

      {open ? (
        <>
          <DateTimePicker
            // Defaults to the minimum rather than today so the spinner never
            // opens on a date the picker would reject.
            value={selected ?? minimumDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
            accentColor={theme.primary}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              className="self-end rounded-[12px] px-4 py-2 active:opacity-70"
            >
              <Text className="font-body-bold text-body-md text-primary">Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

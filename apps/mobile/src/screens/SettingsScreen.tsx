/**
 * Purpose: Settings screen — notification/appearance controls plus the account
 *   "danger zone" entry point to permanent account deletion.
 * Why important: Hosts the in-app delete-account link required by App Store /
 *   Play Store policy; extracted from ProfileScreens.tsx to respect the file-size rule.
 * Used by: app/settings.tsx route.
 */
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColorSchemeToggle } from '@/components/ui/color-scheme-toggle';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center justify-between rounded-[20px] bg-secondary p-4"
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <View
        className={value ? 'rounded-full bg-primary px-3 py-1.5' : 'rounded-full bg-card px-3 py-1.5'}
      >
        <Text
          className={
            value ? 'text-xs font-semibold text-primary-foreground' : 'text-xs font-semibold text-foreground'
          }
        >
          {value ? 'On' : 'Off'}
        </Text>
      </View>
    </Pressable>
  );
}

export function SettingsScreen() {
  const { settings, updateSettings } = useMobileApp();

  return (
    <Screen>
      <SectionHeader
        kicker="Settings"
        title="Notifications and appearance"
        description="Push, SMS, saved search, theme"
      />

      <Card className="items-center gap-4">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">
          Appearance
        </Text>
        <ColorSchemeToggle showLabels />
        <Text className="text-center text-sm leading-6 text-muted-foreground">
          Switch the mobile app between the light and dark presentation at any time.
        </Text>
      </Card>

      <View className="gap-3">
        <ToggleRow
          label="Push notifications"
          value={settings.pushNotifications}
          onPress={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
        />
        <ToggleRow
          label="SMS alerts"
          value={settings.smsAlerts}
          onPress={() => updateSettings({ smsAlerts: !settings.smsAlerts })}
        />
        <ToggleRow
          label="Saved-search alerts"
          value={settings.savedSearchAlerts}
          onPress={() => updateSettings({ savedSearchAlerts: !settings.savedSearchAlerts })}
        />
      </View>

      <View className="gap-3">
        <Link href={appRoutes.helpCenter} asChild>
          <Button variant="outline" label="Help center" />
        </Link>
        <Link href={appRoutes.appUpdate} asChild>
          <Button variant="outline" label="What is new" />
        </Link>
      </View>

      <Card className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-destructive">
          Danger zone
        </Text>
        <Text className="text-sm leading-6 text-muted-foreground">
          Permanently delete your account and all associated listings, credits, and history.
        </Text>
        <Link href={appRoutes.deleteAccount} asChild>
          <Button variant="outline" label="Delete account" className="border-destructive" />
        </Link>
      </Card>
    </Screen>
  );
}

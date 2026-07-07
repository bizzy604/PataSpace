/**
 * Purpose: Settings — notification toggles, appearance, quick links, log out,
 *   and the account "danger zone" entry to permanent deletion.
 * Why important: Hosts the in-app delete-account link required by App Store /
 *   Play Store policy; restyled onto the redesign kit with no logic changes.
 * Used by: app/settings.tsx route.
 */
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import { Dialog } from '@/components/ui/dialog';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMobileApp } from '@/features/mobile-app/mobile-app-provider';
import { appRoutes } from '@/lib/routes';

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mt-2 font-body-bold text-label-md uppercase tracking-[1px] text-muted-foreground">
      {children}
    </Text>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  divider,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  divider?: boolean;
}) {
  const { theme } = useMobileApp();
  return (
    <View
      className={`flex-row items-center justify-between gap-3 px-4 py-3 ${divider ? 'border-b border-border' : ''}`}
    >
      <View className="flex-1">
        <Text className="font-body-medium text-body-lg text-foreground">{label}</Text>
        {subtitle ? (
          <Text className="font-body text-label-md text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.primary, false: theme.outline }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function SettingsScreen() {
  const { settings, updateSettings, colorScheme, setColorSchemePreference, logout } = useMobileApp();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogout(false);
    }
  }

  return (
    <Screen header={<ScreenHeader title="Settings" onBack={() => router.back()} />}>
      <SectionLabel>Notifications</SectionLabel>
      <View className="rounded-[16px] bg-card shadow-card">
        <ToggleRow
          label="Push Notifications"
          value={settings.pushNotifications}
          onValueChange={(next) => updateSettings({ pushNotifications: next })}
          divider
        />
        <ToggleRow
          label="SMS Alerts"
          subtitle="Unlocks, confirmations, and payments"
          value={settings.smsAlerts}
          onValueChange={(next) => updateSettings({ smsAlerts: next })}
          divider
        />
        <ToggleRow
          label="Saved-search Alerts"
          value={settings.savedSearchAlerts}
          onValueChange={(next) => updateSettings({ savedSearchAlerts: next })}
        />
      </View>

      <SectionLabel>Appearance</SectionLabel>
      <View className="flex-row gap-1 rounded-full bg-surface-subtle p-1">
        {(['light', 'dark'] as const).map((scheme) => (
          <Pressable
            key={scheme}
            onPress={() => setColorSchemePreference(scheme)}
            className={
              colorScheme === scheme
                ? 'flex-1 items-center rounded-full bg-card py-2.5 shadow-card'
                : 'flex-1 items-center rounded-full py-2.5'
            }
          >
            <Text
              className={
                colorScheme === scheme
                  ? 'font-body-medium text-body-md text-foreground'
                  : 'font-body-medium text-body-md text-muted-foreground'
              }
            >
              {scheme === 'light' ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>More</SectionLabel>
      <View className="gap-2">
        <Link href={appRoutes.helpCenter} asChild>
          <ListRow icon="help-circle-outline" title="Help Center" chevron />
        </Link>
        <Link href={appRoutes.appUpdate} asChild>
          <ListRow icon="sparkles-outline" title="What's New" chevron />
        </Link>
      </View>

      <SectionLabel>Account Management</SectionLabel>
      <View className="gap-2">
        <ListRow icon="log-out-outline" title="Log Out" destructive onPress={() => setShowLogout(true)} />
        <Link href={appRoutes.deleteAccount} asChild>
          <ListRow icon="trash-outline" title="Delete Account" destructive />
        </Link>
      </View>

      <Dialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        icon="log-out-outline"
        title="Log Out?"
        message="Are you sure you want to log out of your PataSpace account? You will need to verify your phone number again to sign back in."
        confirm={{
          label: isLoggingOut ? 'Logging out…' : 'Log Out',
          variant: 'dark',
          disabled: isLoggingOut,
          onPress: () => void handleLogout(),
        }}
        cancel={{ label: 'Cancel', variant: 'ghost', onPress: () => setShowLogout(false) }}
      />
    </Screen>
  );
}

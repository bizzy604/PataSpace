/**
 * Purpose: Confirmation screen for permanent account deletion — explains the
 *   consequences and runs the deletion via useDeleteAccount.
 * Why important: Satisfies App Store 5.1.1(v) and Google Play account-deletion
 *   policy with an explicit, user-initiated, irreversible action.
 * Used by: app/delete-account.tsx route; linked from SettingsScreen.
 */
import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { appRoutes } from '@/lib/routes';

const REMOVED_ITEMS = [
  'Your profile and login',
  'All your listings and their photos',
  'Remaining credits and transaction history',
  'Unlocks, confirmations, and saved listings',
];

export function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount, isDeleting, error } = useDeleteAccount();

  async function runDeletion() {
    const deleted = await deleteAccount();
    if (deleted) {
      router.replace(appRoutes.login);
    }
  }

  function confirmDeletion() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: runDeletion },
      ],
    );
  }

  return (
    <Screen>
      <SectionHeader
        kicker="Account"
        title="Delete your account"
        description="This action is permanent and cannot be undone."
      />

      <Card className="gap-3">
        <Text className="text-sm font-semibold text-foreground">What gets deleted</Text>
        {REMOVED_ITEMS.map((item) => (
          <Text key={item} className="text-sm leading-6 text-muted-foreground">
            {`• ${item}`}
          </Text>
        ))}
      </Card>

      {error ? <Text className="text-sm leading-6 text-destructive">{error}</Text> : null}

      <View className="gap-3">
        <Button
          label={isDeleting ? 'Deleting…' : 'Delete my account'}
          className="border-destructive bg-destructive"
          disabled={isDeleting}
          onPress={confirmDeletion}
        />
        <Button
          variant="outline"
          label="Cancel"
          disabled={isDeleting}
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

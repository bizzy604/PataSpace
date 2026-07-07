/**
 * Purpose: Permanent account-deletion confirmation, presented as the design's
 *   centered modal over the settings backdrop. Runs deletion via
 *   useDeleteAccount.
 * Why important: Satisfies App Store 5.1.1(v) and Google Play account-deletion
 *   policy with an explicit, user-initiated, irreversible action. The deletion
 *   logic is unchanged; only the presentation is the redesign modal.
 * Used by: app/delete-account.tsx route; linked from Settings and Profile.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Dialog } from '@/components/ui/dialog';
import { Screen } from '@/components/ui/screen';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { appRoutes } from '@/lib/routes';

export function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount, isDeleting, error } = useDeleteAccount();

  async function runDeletion() {
    const deleted = await deleteAccount();
    if (deleted) {
      router.replace(appRoutes.login);
    }
  }

  return (
    <Screen>
      <Dialog
        visible
        onClose={() => router.back()}
        icon="trash-outline"
        tone="danger"
        title="Delete Account?"
        message={
          <View className="gap-2">
            <Text className="text-center font-body text-body-md text-muted-foreground">
              This action is permanent. All your listings, credits, and transaction history will be
              lost forever.
            </Text>
            {error ? (
              <Text className="text-center font-body text-body-md text-danger">{error}</Text>
            ) : null}
          </View>
        }
        confirm={{
          label: isDeleting ? 'Deleting…' : 'Delete My Account',
          variant: 'danger',
          disabled: isDeleting,
          onPress: () => void runDeletion(),
        }}
        cancel={{
          label: 'Keep Account',
          variant: 'outline',
          disabled: isDeleting,
          onPress: () => router.back(),
        }}
      />
    </Screen>
  );
}

/**
 * Purpose: Route that renders the account-deletion confirmation screen.
 * Why important: Exposes /delete-account, linked from Settings, for the
 *   store-required in-app account-deletion flow.
 * Used by: expo-router; SettingsScreen links here via appRoutes.deleteAccount.
 */
import { DeleteAccountScreen } from '@/screens/DeleteAccountScreen';

export default function DeleteAccountRoute() {
  return <DeleteAccountScreen />;
}

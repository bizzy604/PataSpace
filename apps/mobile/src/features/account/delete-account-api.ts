/**
 * Purpose: API call that permanently deletes the authenticated user's account.
 * Why important: Backs the in-app account-deletion flow required by the App Store
 *   and Google Play; keeps the endpoint detail out of UI code.
 * Used by: useDeleteAccount hook (account feature).
 */
import { apiFetch } from '@/lib/api-client';

export async function deleteAccountApi(
  getToken: () => Promise<string | null>,
): Promise<void> {
  await apiFetch<void>('/users/me', getToken, { method: 'DELETE' });
}

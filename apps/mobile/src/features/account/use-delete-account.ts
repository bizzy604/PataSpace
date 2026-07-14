/**
 * Purpose: Hook that runs the account-deletion flow — calls the API, then
 *   clears the local session — exposing loading and error state.
 * Why important: Centralizes the irreversible deletion sequence so the screen
 *   stays declarative and the steps can't drift apart.
 * Used by: DeleteAccountScreen.
 */
import { useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/auth-provider';
import { deleteAccountApi } from './delete-account-api';

export function useDeleteAccount() {
  const { getToken, logout } = useAuthSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount(): Promise<boolean> {
    if (isDeleting) {
      return false;
    }

    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccountApi(getToken);
      // The account (and its refresh tokens) is already gone server-side —
      // logout's best-effort POST /auth/logout may 401/404, which is fine;
      // clearing local session state is what matters here.
      await logout();
      return true;
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Could not delete your account. Please try again.',
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return { deleteAccount, isDeleting, error };
}

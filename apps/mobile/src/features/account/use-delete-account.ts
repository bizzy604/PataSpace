/**
 * Purpose: Hook that runs the account-deletion flow — calls the API, then signs
 *   the user out of Clerk — exposing loading and error state.
 * Why important: Centralizes the irreversible deletion sequence so the screen
 *   stays declarative and the steps can't drift apart.
 * Used by: DeleteAccountScreen.
 */
import { useState } from 'react';
import { useAuth, useClerk } from '@clerk/expo';
import { ApiRequestError } from '@/lib/api-client';
import { deleteAccountApi } from './delete-account-api';

export function useDeleteAccount() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
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
      await signOut();
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

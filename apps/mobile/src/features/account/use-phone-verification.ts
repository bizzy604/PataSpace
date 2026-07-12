/**
 * Purpose: State for the pre-submission phone-verification gate: loads the
 * profile's verified status, requests an OTP, confirms it, and exposes the
 * gate status to screens.
 * Why important: listing submission is blocked server-side until the account
 * has a verified phone; this hook is the client half of that contract. No
 * SMS provider is wired yet, so in sandbox mode the code is the fixed
 * sandbox OTP.
 * Used by: ListingReviewScreen via phone-verification-card.
 */
import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import {
  fetchMyProfile,
  requestPhoneVerification,
  verifyPhoneVerification,
} from '@/lib/api/users';
import {
  normalizeKenyanPhoneInput,
  type PhoneVerificationStatus,
} from './phone-verification-gate';

export function usePhoneVerification() {
  const { getToken, isSignedIn } = useAuth();
  const [status, setStatus] = useState<PhoneVerificationStatus>('loading');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!isSignedIn) {
      setStatus('unknown');
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const profile = await fetchMyProfile(getToken);
        if (cancelled) {
          return;
        }
        setStatus(profile.phoneVerified ? 'verified' : 'unverified');
        if (profile.phoneNumber) {
          setPhoneNumber(profile.phoneNumber);
        }
      } catch {
        // Profile fetch failed: do not block the flow — the server re-checks
        // on submit and PHONE_NOT_VERIFIED routes back into the card.
        if (!cancelled) {
          setStatus('unknown');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  const requestCode = useCallback(async () => {
    const normalized = normalizeKenyanPhoneInput(phoneNumber);
    if (!normalized) {
      setError('Enter a valid Kenyan number, e.g. 0712 345 678');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await requestPhoneVerification(getToken, normalized);
      setPhoneNumber(normalized);
      setCodeRequested(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError && err.code === 'PHONE_ALREADY_REGISTERED'
          ? 'This number belongs to another account. Use a different number.'
          : err instanceof Error
            ? err.message
            : 'Could not send the code. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }, [getToken, phoneNumber]);

  const confirmCode = useCallback(
    async (code: string) => {
      setBusy(true);
      setError('');
      try {
        await verifyPhoneVerification(getToken, phoneNumber, code.trim());
        setStatus('verified');
      } catch (err) {
        setError(
          err instanceof ApiRequestError && err.code === 'INVALID_OTP'
            ? 'That code is not right or has expired. Request a fresh one.'
            : err instanceof Error
              ? err.message
              : 'Verification failed. Try again.',
        );
      } finally {
        setBusy(false);
      }
    },
    [getToken, phoneNumber],
  );

  const markUnverified = useCallback(() => {
    setStatus('unverified');
  }, []);

  return {
    busy,
    codeRequested,
    confirmCode,
    error,
    markUnverified,
    phoneNumber,
    requestCode,
    setPhoneNumber,
    status,
  };
}

export type PhoneVerification = ReturnType<typeof usePhoneVerification>;

/**
 * Purpose: Client button that calls /unlocks to reveal contact info, then
 *   routes the tenant to the unlock detail page.
 * Why important: Replaces the deep-link "Reveal contact" anchor with a real
 *   wallet-debiting API call against the backend.
 * Used by: apps/web/app/listings/[id]/unlock/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/api/client';
import { createUnlock } from '@/lib/api/unlocks';

type Props = {
  listingId: string;
  existingUnlockId: string | null;
  insufficientCredits: boolean;
};

export function UnlockCheckoutButton({
  listingId,
  existingUnlockId,
  insufficientCredits,
}: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (existingUnlockId) {
      router.push(`/unlocks/${existingUnlockId}`);
      return;
    }
    if (insufficientCredits) {
      router.push('/wallet/buy');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await createUnlock(getToken, listingId);
      router.push(`/unlocks/${response.unlockId}`);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'We could not unlock the listing. Try again.';
      setError(message);
      setSubmitting(false);
    }
  }

  const label = existingUnlockId
    ? 'View revealed contact'
    : insufficientCredits
      ? 'Top up to unlock'
      : submitting
        ? 'Unlocking…'
        : 'Reveal contact';

  return (
    <div className="space-y-3">
      <Button
        onClick={handleClick}
        disabled={submitting}
        className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
      >
        {label}
      </Button>
      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

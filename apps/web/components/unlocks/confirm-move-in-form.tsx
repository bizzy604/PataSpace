/**
 * Purpose: Client form that submits a tenant move-in confirmation to /confirmations.
 * Why important: Replaces the inert demo button so the incoming tenant can
 *   actually progress the unlock through the confirmation state machine.
 * Used by: apps/web/app/unlocks/[id]/confirm/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmUnlock } from '@/lib/api/unlocks';
import { ApiRequestError } from '@/lib/api/client';

const CHECKLIST_ITEMS = [
  'You reached the current tenant on the revealed contact details.',
  'The property details and occupancy context matched what was discussed.',
  'You are ready to confirm the move-in outcome on your side.',
];

type Props = {
  unlockId: string;
  alreadyConfirmed: boolean;
};

export function ConfirmMoveInForm({ unlockId, alreadyConfirmed }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyConfirmed);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await confirmUnlock(getToken, unlockId);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'We could not record your confirmation. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {CHECKLIST_ITEMS.map((item) => (
        <div
          key={item}
          className="flex gap-4 border border-border bg-muted p-4 text-sm leading-7 text-muted-foreground"
        >
          <span className="mt-1 flex size-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <CheckCircle2 className="size-4" />
          </span>
          <p>{item}</p>
        </div>
      ))}

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          Your confirmation is recorded. Once the other party confirms, the
          commission clock starts.
        </p>
      ) : null}

      <Button
        onClick={handleSubmit}
        disabled={submitting || done}
        className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
      >
        {done
          ? 'Confirmation recorded'
          : submitting
            ? 'Recording…'
            : 'Confirm move-in'}
      </Button>
    </div>
  );
}

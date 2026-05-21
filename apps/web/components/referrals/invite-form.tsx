/**
 * Purpose: Client form that submits a new referral invite to POST /referrals.
 * Why important: Lets a signed-in tenant invite friends from the web. The
 *   referrer-self guard, duplicate-invite guard, and phone-format check all
 *   live on the backend — we just surface the errors.
 * Used by: apps/web/app/referrals/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiRequestError } from '@/lib/api/client';
import { createReferral } from '@/lib/api/referrals';

export function ReferralInviteForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMaskedPhone, setSentMaskedPhone] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const trimmed = phone.trim();
    if (trimmed.length < 7) {
      setError('Enter a Kenyan phone number with at least 7 digits.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createReferral(getToken, { phoneNumber: trimmed });
      setSentMaskedPhone(created.inviteePhoneMasked);
      setPhone('');
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'We could not record your invite. Try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="referral-phone">
          Friend's phone number
        </label>
        <Input
          id="referral-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0700123456 or +254712345678"
          maxLength={20}
        />
      </div>

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {sentMaskedPhone ? (
        <p className="border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
          Invite recorded for <span className="font-mono">{sentMaskedPhone}</span>. They get the
          reward triggered after their first credit purchase.
        </p>
      ) : null}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
      >
        {submitting ? 'Sending…' : 'Send invite'}
      </Button>
    </div>
  );
}

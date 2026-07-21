/**
 * Purpose: Web fallback for the email-verification magic link. The email's
 *   verify button points at /verify-email?email=...&token=...; on a phone the
 *   universal link opens the app instead, everywhere else this page confirms
 *   the address by calling the public verify-link endpoint.
 * Why important: The magic link must verify even when the app is not
 *   installed, or the flow silently dead-ends for the user.
 * Used by: the verification email sent by POST /auth/email-verification/request.
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { clientFetch } from '@/lib/api/client';

type VerifyState = 'verifying' | 'done' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setState('error');
      setMessage('This verification link is incomplete. Request a fresh verification email.');
      return;
    }

    clientFetch('/auth/email-verification/verify-link', async () => null, {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    })
      .then(() => setState('done'))
      .catch((caught: unknown) => {
        setState('error');
        setMessage(
          caught instanceof Error
            ? caught.message
            : 'That verification link is invalid or has expired.',
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-foreground">
          {state === 'done'
            ? 'Email verified'
            : state === 'error'
              ? 'Verification failed'
              : 'Verifying your email…'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {state === 'done'
            ? 'Your PataSpace email address is confirmed. You can return to the app.'
            : state === 'error'
              ? message
              : 'Hold on while we confirm your email address.'}
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

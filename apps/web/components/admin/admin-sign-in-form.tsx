/**
 * Purpose: Email + password credentials form for the admin console's only
 *   auth entry point.
 * Why important: Calls NextAuth's `signIn('credentials', ...)` with
 *   redirect:false so it can read the API's actual rejection reason (wrong
 *   password, banned account, non-admin role, unverified phone) off the
 *   result and show it directly, instead of a single generic error.
 * Used by: app/admin/sign-in/page.tsx.
 */
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { linkButtonClass } from '@/lib/link-button';
import { cn } from '@/lib/utils';

// Mirrors the CredentialsSignin subclasses thrown from auth.ts's authorize()
// — the API's own error code where one exists (INVALID_CREDENTIALS,
// ACCOUNT_BANNED, ACCOUNT_INACTIVE, PHONE_NOT_VERIFIED), plus two web-only
// codes (NOT_ADMIN, LOGIN_UNAVAILABLE) for cases the API itself has no
// opinion on.
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  ACCOUNT_BANNED: 'This account has been suspended. Contact support for details.',
  ACCOUNT_INACTIVE: 'This account is inactive.',
  PHONE_NOT_VERIFIED: 'This account has not completed phone verification yet.',
  NOT_ADMIN: 'This account does not have admin access.',
  LOGIN_UNAVAILABLE: 'Sign-in is temporarily unavailable. Try again shortly.',
};
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Try again.';

export function AdminSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      const code = result?.code;
      setError((code && ERROR_MESSAGES[code]) ?? DEFAULT_ERROR_MESSAGE);
      setSubmitting(false);
      return;
    }

    const callbackUrl = searchParams.get('callbackUrl');
    router.push(callbackUrl && callbackUrl.startsWith('/admin') ? callbackUrl : '/admin');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={cn(linkButtonClass({ fullWidth: true }), 'justify-center')}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </button>
    </form>
  );
}

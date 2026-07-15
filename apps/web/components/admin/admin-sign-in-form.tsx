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
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@pataspace.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            className="h-12 pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            className="h-12 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <span
            aria-hidden
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold"
          >
            !
          </span>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={cn(linkButtonClass({ fullWidth: true }), 'mt-1 h-12 justify-center')}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}

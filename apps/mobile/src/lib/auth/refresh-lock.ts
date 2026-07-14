/**
 * Purpose: Single-flight coordinator for the auth token refresh call. Pure
 *   (no React, no fetch) so the concurrency guarantee is unit-testable: N
 *   concurrent callers while a refresh is in flight must collapse into exactly
 *   one underlying call and all share its result.
 * Why important: Every API call attaches the current access token; when
 *   several requests fire in parallel and all 401 at once (token just
 *   expired), each would otherwise kick off its own POST /auth/refresh —
 *   burning refresh-token rotations and racing each other for which rotation
 *   wins. This makes concurrent 401s trigger exactly one refresh.
 * Used by: features/auth/auth-provider.tsx (wraps the refresh API call);
 *   __tests__/refresh-lock.test.ts.
 */

/**
 * Wrap `run` so that calling the returned function while a previous call is
 * still pending returns the *same* in-flight promise instead of starting a
 * new one. Once the pending call settles (resolve or reject), the next call
 * starts a fresh run.
 */
export function createSingleFlight<T>(run: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;

  return function trigger(): Promise<T> {
    if (pending) {
      return pending;
    }

    pending = run().finally(() => {
      pending = null;
    });

    return pending;
  };
}

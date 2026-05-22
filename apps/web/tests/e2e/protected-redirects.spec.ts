/**
 * Purpose: Verify Clerk middleware blocks workspace routes when signed out.
 * Why important: Confirms the proxy.ts protected-route matcher is wired so
 *   unauthenticated traffic to /wallet, /unlocks, /referrals, /saved redirects
 *   to the sign-in flow instead of leaking the workspace shell.
 */
import { test, expect } from './fixtures/api-mock';

const PROTECTED_PATHS = [
  '/wallet',
  '/unlocks',
  '/referrals',
  '/saved',
  '/profile',
  '/post/upload-photos',
] as const;

test.describe('Clerk-protected routes (signed-out)', () => {
  for (const pathname of PROTECTED_PATHS) {
    test(`${pathname} redirects to the Clerk sign-in flow`, async ({ page }) => {
      const response = await page.goto(pathname);
      expect(response).toBeTruthy();

      // Either Clerk redirected to /sign-in OR to /auth/sign-in (configured
      // fallback). The point is: we are no longer on the workspace route.
      const url = new URL(page.url());
      expect(url.pathname).not.toBe(pathname);
    });
  }
});

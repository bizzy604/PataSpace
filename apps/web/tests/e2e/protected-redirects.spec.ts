/**
 * Purpose: Verify the middleware's two gates — /admin requires a NextAuth
 *   session, and retired tenant routes bounce back to the landing page.
 * Why important: Confirms proxy.ts is wired so the console never leaks to
 *   signed-out visitors and the old tenant surface stays gone.
 */
import { test, expect } from './fixtures/api-mock';

const ADMIN_PATHS = ['/admin', '/admin/listings', '/admin/users', '/admin/disputes'] as const;

const RETIRED_TENANT_PATHS = [
  '/wallet',
  '/listings',
  '/search',
  '/unlocks',
  '/post',
  '/auth/sign-in',
] as const;

test.describe('admin routes (signed-out)', () => {
  for (const pathname of ADMIN_PATHS) {
    test(`${pathname} redirects to the admin sign-in flow`, async ({ page }) => {
      await page.goto(pathname);
      await expect(page).toHaveURL(/\/admin\/sign-in/);
    });
  }
});

test.describe('retired tenant routes', () => {
  for (const pathname of RETIRED_TENANT_PATHS) {
    test(`${pathname} redirects to the landing page`, async ({ page }) => {
      await page.goto(pathname);
      const url = new URL(page.url());
      expect(url.pathname).toBe('/');
    });
  }
});

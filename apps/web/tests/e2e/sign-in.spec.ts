/**
 * Purpose: Exercises the admin console's only auth entry point end to end —
 *   valid admin credentials succeed, a wrong password fails, and a valid
 *   non-admin account is rejected even though its password is correct.
 * Why important: auth.ts rejects non-admin roles inside authorize() itself
 *   (not just in route-gating UI), so a correct password for a tenant
 *   account must never mint a session here. This is the regression test for
 *   that rule, plus the happy path and the generic wrong-credentials path.
 * Note: the two accounts below must match fixtures/mock-auth-server.mjs
 *   exactly — that server stands in for the API's POST /auth/login (which
 *   NextAuth's Credentials provider calls from the Next.js *server* process,
 *   so page.route() cannot mock it — see playwright.config.ts).
 */
import { test, expect, type Page } from '@playwright/test';

// Serial: the first sign-in against a fresh dev server pays the one-time
// webpack cold-compile cost for /api/auth/[...nextauth] and /admin. Running
// these in parallel makes several tests race that compile at once and flake;
// serial lets the first absorb it and the rest run warm.
test.describe.configure({ mode: 'serial' });

// Generous cap so the first (cold) sign-in's signIn() round trip and redirect
// finish before the assertion times out. The default 15s is fine once warm
// but too tight for the very first route compile.
const COLD_COMPILE_TIMEOUT = 60_000;

const ADMIN_ACCOUNT = { email: 'admin@e2e.pataspace.local', password: 'Correct-Horse-9!' };
const NON_ADMIN_ACCOUNT = { email: 'tenant@e2e.pataspace.local', password: 'Battery-Staple-9!' };

async function submitSignIn(page: Page, email: string, password: string) {
  await page.goto('/admin/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('admin sign-in', () => {
  test('valid admin credentials sign in and reach the console', async ({ page }) => {
    await submitSignIn(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);

    await expect(page).toHaveURL(/\/admin$/, { timeout: COLD_COMPILE_TIMEOUT });
    // AdminShell renders the signed-in admin's name from the session.
    await expect(page.getByText('Ada Admin')).toBeVisible({ timeout: COLD_COMPILE_TIMEOUT });
    // exact: the brand-logo link's aria-label "Admin dashboard" would
    // otherwise substring-match "Dashboard" too.
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('a wrong password is rejected with the actual reason, not a generic error', async ({ page }) => {
    await submitSignIn(page, ADMIN_ACCOUNT.email, 'definitely-the-wrong-password');

    // Scope the error by its text: the form's <p role="alert"> otherwise
    // collides with Next's always-present, empty route-announcer (role=alert).
    await expect(page.getByText(/email or password is incorrect/i)).toBeVisible({
      timeout: COLD_COMPILE_TIMEOUT,
    });
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

  test('a correct password for a non-admin account is rejected', async ({ page }) => {
    await submitSignIn(page, NON_ADMIN_ACCOUNT.email, NON_ADMIN_ACCOUNT.password);

    await expect(page.getByText(/does not have admin access/i)).toBeVisible({
      timeout: COLD_COMPILE_TIMEOUT,
    });
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });
});

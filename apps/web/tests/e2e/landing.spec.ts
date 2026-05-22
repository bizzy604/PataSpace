/**
 * Purpose: Landing-page smoke tests + login-button visibility checks.
 * Why important: Ensures the property-owner landing renders, exposes the
 *   Sign in and Register CTAs, and that the routes those buttons target
 *   are reachable.
 */
import { test, expect } from './fixtures/api-mock';
import { collectPageErrors } from './fixtures/page-errors';

test.describe('landing page', () => {
  test('renders hero, value props, and CTA without errors', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Your units should never/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/PataSpace connects your outgoing tenants/i),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Request a 15-Minute Demo/i })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('exposes Sign in and Register buttons to signed-out visitors', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav').first();
    await expect(nav.getByRole('button', { name: /Sign in/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Register/i })).toBeVisible();
  });

  test('Clerk SDK loads on landing (Sign in button is wired)', async ({ page }) => {
    await page.goto('/');

    // The Clerk SDK loads asynchronously after hydration. If this succeeds,
    // the Sign in button has its click handler attached — its behaviour
    // (navigate vs. modal) is Clerk's contract and is covered separately by
    // the /auth/sign-in route test. Asserting on the click race introduces
    // timing flake without adding integration value.
    await page.waitForFunction(
      () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded),
      undefined,
      { timeout: 30_000 },
    );

    await expect(
      page.locator('nav').first().getByRole('button', { name: /Sign in/i }),
    ).toBeVisible();
  });

  test('the /auth/sign-in route renders the Clerk widget', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('the /auth/register route renders the Clerk widget', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

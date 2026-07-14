/**
 * Purpose: Landing-page smoke tests for the waitlist landing.
 * Why important: The landing page is the whole public product of the web app
 *   (all tenant flows live in mobile); this proves it renders without errors
 *   and exposes the waitlist CTA.
 */
import { test, expect } from './fixtures/api-mock';
import { collectPageErrors } from './fixtures/page-errors';

test.describe('landing page', () => {
  test('renders the waitlist hero and CTA without errors', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: /The end of/i })).toBeVisible();
    await expect(
      page.locator('nav').first().getByRole('link', { name: /Join Waitlist/i }),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('the /admin/sign-in route serves the credentials sign-in form', async ({ page }) => {
    await page.goto('/admin/sign-in');
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await expect(page.getByRole('heading', { name: /Admin sign in/i })).toBeVisible();
  });
});

/**
 * Purpose: Smoke + render tests for the public marketing routes.
 * Why important: /about, /how-it-works, and /pricing are the only public
 *   pages besides the landing; this proves each renders server-side without
 *   exceptions and carries the marketing frame.
 */
import { test, expect } from './fixtures/api-mock';
import { collectPageErrors } from './fixtures/page-errors';

const MARKETING_PATHS = ['/about', '/how-it-works', '/pricing'] as const;

test.describe('marketing pages', () => {
  for (const pathname of MARKETING_PATHS) {
    test(`${pathname} renders without server or client errors`, async ({ page }) => {
      const { errors } = collectPageErrors(page);

      const response = await page.goto(pathname);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('header').first()).toBeVisible();
      await expect(
        page.locator('header').getByRole('link', { name: /Admin sign in/i }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

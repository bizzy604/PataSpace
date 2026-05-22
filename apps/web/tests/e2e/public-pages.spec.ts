/**
 * Purpose: Smoke + render tests for the public (unauthenticated) routes.
 * Why important: Server-rendered Next pages call /api/v1 from Node, which is
 *   invisible to page.route(). We instead assert each route reaches the
 *   browser without server exceptions or client-side runtime errors — proof
 *   that the server fetch chain (with whatever backend response, real or
 *   error) executed.
 */
import { test, expect } from './fixtures/api-mock';
import { collectPageErrors } from './fixtures/page-errors';

test.describe('public pages', () => {
  test('/listings renders without server or client errors', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    const response = await page.goto('/listings');
    expect(response?.ok()).toBeTruthy();
    // Header from the workspace shell should be present whether or not the
    // backend returned data.
    await expect(page.locator('header').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('/listings/[id] renders without server or client errors', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    const response = await page.goto('/listings/cm8mocklisting');
    // 404 is also a valid "rendered cleanly" outcome — Next renders the
    // not-found page when getListingById throws. The test fails if the page
    // crashes outright (500 with no body).
    expect(response?.status()).toBeLessThan(500);
    expect(errors).toEqual([]);
  });

  test('/support renders without errors', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    const response = await page.goto('/support');
    // Support route is workspace-shell wrapped; Clerk middleware may redirect
    // when no session is present. Either render OR redirect to sign-in is
    // a healthy "no exception" outcome.
    expect(response).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('/about marketing page renders', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    await page.goto('/about');
    expect(errors).toEqual([]);
  });

  test('/pricing marketing page renders', async ({ page }) => {
    const { errors } = collectPageErrors(page);

    await page.goto('/pricing');
    expect(errors).toEqual([]);
  });
});

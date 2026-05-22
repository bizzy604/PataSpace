/**
 * Purpose: Playwright runner config for apps/web — boots the Next.js dev server
 *   and runs E2E tests against it.
 * Why important: Browsers run against a real Next.js process, so route-level
 *   server fetches actually fire and can be intercepted with page.route()
 *   to assert the workspace is wired to /api/v1.
 * Used by: `pnpm -F @pataspace/web test:e2e`.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4400;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',

  // Next.js dev cold-compiles each route on first visit (especially the
  // landing, which pulls in three.js + @react-three/drei). Per-test cap of
  // 2 min and nav cap of 90s give every route room to warm.
  timeout: 120_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `pnpm exec next dev --webpack --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // Next.js auto-loads apps/web/.env, which already supplies the real
    // Clerk dev publishable key + API base URL. Do not override here — a
    // placeholder Clerk key crashes every server render.
  },
});

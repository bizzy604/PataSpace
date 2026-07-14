/**
 * Purpose: Playwright runner config for apps/web — boots the mock auth API
 *   and the Next.js dev server, then runs E2E tests against them.
 * Why important: Browsers run against a real Next.js process, so route-level
 *   server fetches actually fire and can be intercepted with page.route()
 *   to assert the workspace is wired to /api/v1. NextAuth's Credentials
 *   provider calls POST /auth/login from the *server* process though, which
 *   page.route() cannot see — the mock auth server (fixtures/mock-auth-
 *   server.mjs) gives sign-in.spec.ts a real endpoint for that call instead.
 * Used by: `pnpm -F @pataspace/web test:e2e`.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4400;
const MOCK_AUTH_PORT = 3999;

// Export the real values (see apps/web/README.md's E2E Tests section) before
// running `pnpm test:e2e` to point the whole suite at a live API instead of
// the mock auth server — useful for a genuine end-to-end check, but not
// something the committed gate suite depends on.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:${MOCK_AUTH_PORT}/api/v1`;
const apiInternalBaseUrl = process.env.API_INTERNAL_BASE_URL ?? apiBaseUrl;
const usingMockAuthServer = apiBaseUrl === `http://localhost:${MOCK_AUTH_PORT}/api/v1`;

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

  webServer: [
    // Only needed when nothing else supplied NEXT_PUBLIC_API_BASE_URL —
    // reuseExistingServer keeps this a no-op cost when a real API is used.
    ...(usingMockAuthServer
      ? [
          {
            command: `node tests/e2e/fixtures/mock-auth-server.mjs`,
            url: `http://localhost:${MOCK_AUTH_PORT}/api/v1/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
            stdout: 'ignore' as const,
            stderr: 'pipe' as const,
            env: { MOCK_AUTH_PORT: String(MOCK_AUTH_PORT) },
          },
        ]
      : []),
    {
      command: `pnpm exec next dev --webpack --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
      // Self-contained: NextAuth requires AUTH_SECRET to boot at all (it
      // throws MissingSecret otherwise), so the suite supplies one here
      // rather than depending on a local .env file existing.
      env: {
        AUTH_SECRET: process.env.AUTH_SECRET ?? 'playwright-test-secret-do-not-use-in-production',
        AUTH_URL: `http://localhost:${PORT}`,
        NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
        API_INTERNAL_BASE_URL: apiInternalBaseUrl,
      },
    },
  ],
});

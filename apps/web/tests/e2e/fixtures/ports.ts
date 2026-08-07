/**
 * Purpose: Single source of truth for the ports the e2e suite binds.
 * Why important: playwright.config.ts and the fixtures both need these. When
 *   they were duplicated, a fixture could authenticate against one origin
 *   while the browser ran on another and the failure looked like a broken
 *   session rather than a wrong port.
 * Used by: playwright.config.ts, fixtures/admin-mock.ts.
 */
export const E2E_PORT = 4400;
export const MOCK_AUTH_PORT = 3999;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

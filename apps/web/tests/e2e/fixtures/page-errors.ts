/**
 * Purpose: Collect client-side page errors with known Next.js dev noise filtered out.
 * Why important: Next dev server invalidates JS chunks between tests when the
 *   webserver is shared across specs, surfacing transient "Loading chunk
 *   failed" messages that are not real bugs. We treat them as ignorable so
 *   tests stay focused on actual runtime regressions.
 * Used by: e2e specs that assert "no client-side errors".
 */
import type { Page } from '@playwright/test';

const NEXT_DEV_NOISE_PATTERNS: readonly RegExp[] = [
  /Loading chunk .* failed/i,
  /missing.*_next\/static\/chunks/i,
  /Invalid or unexpected token/i, // chunk-corruption symptom under dev HMR
  /ChunkLoadError/i,
];

export function collectPageErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    const message = error.message;
    if (NEXT_DEV_NOISE_PATTERNS.some((pattern) => pattern.test(message))) {
      return;
    }
    errors.push(message);
  });
  return { errors };
}

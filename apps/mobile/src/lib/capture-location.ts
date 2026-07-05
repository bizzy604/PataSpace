/**
 * Purpose: Pure GPS-fix decision logic for the listing capture flow.
 * Why important: Capture speed and anti-fraud both hinge on these rules;
 *   keeping them free of expo imports makes them unit-testable.
 * Used by: CreateListingScreen (capture handler + GPS warm-up watcher).
 */

export const FRESH_FIX_MAX_AGE_MS = 10_000;
export const WEAK_ACCURACY_THRESHOLD_METERS = 50;

/**
 * A warm fix from the location watcher is usable if it is recent enough.
 * Future-dated timestamps count as stale so a bad clock forces a live fix.
 */
export function isFreshFix(
  fixTimestampMs: number,
  nowMs: number,
  maxAgeMs: number = FRESH_FIX_MAX_AGE_MS,
): boolean {
  const ageMs = nowMs - fixTimestampMs;

  return ageMs >= 0 && ageMs <= maxAgeMs;
}

/**
 * Mocked locations and low-accuracy fixes get flagged "Retake" so listings
 * cannot be posted from a spoofed or vague position.
 */
export function isWeakGpsFix(fix: {
  mocked?: boolean;
  accuracyMeters: number | null | undefined;
}): boolean {
  if (fix.mocked === true) {
    return true;
  }

  return (
    fix.accuracyMeters !== null &&
    fix.accuracyMeters !== undefined &&
    fix.accuracyMeters > WEAK_ACCURACY_THRESHOLD_METERS
  );
}

/** Instant fallback label shown until reverse geocoding resolves. */
export function coordinateLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/**
 * Builds a human label from reverse-geocode address parts (district, street,
 * city). Returns null when nothing usable came back so callers keep the
 * coordinate fallback.
 */
export function pickAddressLabel(parts: Array<string | null | undefined>): string | null {
  const cleaned = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return cleaned.length > 0 ? cleaned.slice(0, 2).join(', ') : null;
}

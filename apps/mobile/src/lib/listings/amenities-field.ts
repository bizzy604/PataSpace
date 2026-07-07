/**
 * Purpose: Pure helpers to drive the details-form amenity chips over the
 *   existing comma-separated `draft.amenities` string — parse, membership, and
 *   toggle — without changing the draft model. No React/RN imports so the node
 *   jest lane can test them.
 * Why important: The redesign shows amenities as toggle chips, but the draft
 *   stores a free-text string the submit payload already uses. This keeps that
 *   contract intact: chips add/remove tokens while any custom, non-preset
 *   tokens the user typed survive untouched.
 * Used by: ListingDetailsFormScreen and __tests__/amenities-field.test.ts.
 */

/** The chip presets shown in the form; custom tokens outside this set persist. */
export const AMENITY_PRESETS = [
  'Water Included',
  'Parking',
  'Wi-Fi',
  'Balcony',
  'Security 24/7',
  'Gym',
];

/** Split the stored string into trimmed, non-empty tokens. */
export function parseAmenities(value: string): string[] {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/** Case-insensitive membership test for a single amenity. */
export function hasAmenity(value: string, amenity: string): boolean {
  const needle = amenity.trim().toLowerCase();
  return parseAmenities(value).some((token) => token.toLowerCase() === needle);
}

/**
 * Add the amenity if absent, remove it (case-insensitively) if present.
 * Preserves the order and casing of every other token, rejoined with ", ".
 */
export function toggleAmenity(value: string, amenity: string): string {
  const target = amenity.trim();
  const tokens = parseAmenities(value);
  const needle = target.toLowerCase();
  const without = tokens.filter((token) => token.toLowerCase() !== needle);

  if (without.length !== tokens.length) {
    return without.join(', ');
  }

  return [...tokens, target].join(', ');
}

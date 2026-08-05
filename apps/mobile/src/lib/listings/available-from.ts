/**
 * Purpose: The date rules behind the "Available from" field — the canonical
 * YYYY-MM-DD storage shape, the human label shown on the button, and the
 * conversion to the ISO instant the API expects.
 * Why important: the field used to be free text. Whatever was typed went
 * straight into `new Date(...)`, and anything it could not parse was silently
 * replaced with today+30 days, so a listing could go live with a move-in date
 * nobody chose. Storing one unambiguous shape removes the parse entirely.
 * Date handling is exactly the arithmetic that does not belong in a component,
 * so it lives here with tests.
 * Used by: components/ui/date-field.tsx, screens/CreateListingFlowScreens.tsx,
 * features/mobile-app/mobile-app-provider.tsx on submit.
 */

/** Canonical stored shape: calendar date, no time, no zone. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * A calendar date as YYYY-MM-DD, read off local getters.
 *
 * Not toISOString().slice(0, 10): that converts to UTC first, so any local time
 * before the UTC offset rolls the date back a day. Kenya is UTC+3, so a date
 * picked at 01:00 EAT would store as the previous day.
 */
export function toISODate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** True when the value is a real calendar date in the canonical shape. */
export function isISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }

  const parsed = parseISODate(value);

  // Round-trip catches values that match the shape but are not real days:
  // Date rolls 2026-02-31 forward to March 3, which formats back differently.
  return parsed !== null && toISODate(parsed) === value;
}

/** Canonical string back to a local Date at midnight, or null if unparseable. */
export function parseISODate(value: string): Date | null {
  if (!ISO_DATE.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  // Local midnight, not `new Date("2026-04-15")`, which the spec parses as UTC.
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** What the picker button shows, e.g. "15 April 2026". Empty when unset. */
export function formatAvailableFrom(value: string): string {
  const parsed = parseISODate(value);
  if (!parsed || !isISODate(value)) {
    return '';
  }

  return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/**
 * The ISO instant the API's availableFrom expects, or null when unset/invalid.
 *
 * Midnight UTC on the chosen day rather than the local instant: the contract
 * field is a calendar date, and anchoring to UTC keeps the day stable no matter
 * which zone reads it back. A local midnight in Kenya would serialize as 21:00
 * the previous day.
 */
export function toApiInstant(value: string): string | null {
  if (!isISODate(value)) {
    return null;
  }

  return `${value}T00:00:00.000Z`;
}

/**
 * Earliest date the picker allows. Today: a home cannot become available in the
 * past, and letting one through means listings that are stale on arrival.
 */
export function minimumAvailableFrom(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

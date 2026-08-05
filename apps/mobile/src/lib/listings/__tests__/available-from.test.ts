/**
 * Purpose: Gate tests for the "Available from" date rules — canonical storage
 * shape, the human label, and the API instant.
 * Why important: the field was free text and unparseable input was silently
 * swapped for today+30 days, so a listing could publish a move-in date nobody
 * picked. These pin the timezone traps that make date code wrong in ways that
 * only show up for some users at some hours.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import {
  formatAvailableFrom,
  isISODate,
  minimumAvailableFrom,
  parseISODate,
  toApiInstant,
  toISODate,
} from '../available-from';

describe('toISODate', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 3, 15))).toBe('2026-04-15');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  /**
   * The reason this does not use toISOString(). Kenya is UTC+3, so 00:30 local
   * on the 15th is 21:30 UTC on the 14th. Reading local getters keeps the day
   * the user actually tapped.
   */
  it('keeps the local calendar day just after local midnight', () => {
    expect(toISODate(new Date(2026, 3, 15, 0, 30))).toBe('2026-04-15');
  });

  it('keeps the local calendar day just before local midnight', () => {
    expect(toISODate(new Date(2026, 3, 15, 23, 45))).toBe('2026-04-15');
  });
});

describe('isISODate', () => {
  it('accepts a real calendar date', () => {
    expect(isISODate('2026-04-15')).toBe(true);
  });

  it('accepts a leap day in a leap year', () => {
    expect(isISODate('2028-02-29')).toBe(true);
  });

  it('rejects a leap day in a non-leap year', () => {
    // Date would roll this to March 1 rather than fail.
    expect(isISODate('2026-02-29')).toBe(false);
  });

  it('rejects a day that does not exist in that month', () => {
    expect(isISODate('2026-02-31')).toBe(false);
  });

  it('rejects free text, the old field contents', () => {
    expect(isISODate('April 15, 2026')).toBe(false);
    expect(isISODate('next month')).toBe(false);
    expect(isISODate('')).toBe(false);
  });

  it('rejects an ISO instant, which is not the storage shape', () => {
    expect(isISODate('2026-04-15T00:00:00.000Z')).toBe(false);
  });

  it('rejects a month or day out of range', () => {
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-00-10')).toBe(false);
  });
});

describe('parseISODate', () => {
  it('round-trips through toISODate', () => {
    const parsed = parseISODate('2026-04-15');
    expect(parsed).not.toBeNull();
    expect(toISODate(parsed as Date)).toBe('2026-04-15');
  });

  it('lands on local midnight, not UTC midnight', () => {
    const parsed = parseISODate('2026-04-15') as Date;
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getDate()).toBe(15);
  });

  it('returns null for anything not in the canonical shape', () => {
    expect(parseISODate('April 15, 2026')).toBeNull();
    expect(parseISODate('')).toBeNull();
  });
});

describe('formatAvailableFrom', () => {
  it('renders a readable label', () => {
    expect(formatAvailableFrom('2026-04-15')).toBe('15 April 2026');
  });

  it('does not zero-pad the day in the label', () => {
    expect(formatAvailableFrom('2026-01-05')).toBe('5 January 2026');
  });

  it('is empty when unset, so the field can show its placeholder', () => {
    expect(formatAvailableFrom('')).toBe('');
  });

  it('is empty for an impossible date rather than showing a rolled-over one', () => {
    expect(formatAvailableFrom('2026-02-31')).toBe('');
  });
});

describe('toApiInstant', () => {
  it('anchors the chosen day to midnight UTC', () => {
    expect(toApiInstant('2026-04-15')).toBe('2026-04-15T00:00:00.000Z');
  });

  it('parses back to the same calendar day', () => {
    const instant = toApiInstant('2026-04-15') as string;
    expect(new Date(instant).getUTCDate()).toBe(15);
    expect(new Date(instant).getUTCMonth()).toBe(3);
  });

  it('returns null when unset, so submit can refuse instead of inventing a date', () => {
    expect(toApiInstant('')).toBeNull();
    expect(toApiInstant('April 15, 2026')).toBeNull();
  });
});

describe('minimumAvailableFrom', () => {
  it('is midnight today, so a past move-in date cannot be picked', () => {
    const min = minimumAvailableFrom(new Date(2026, 7, 5, 14, 30));
    expect(toISODate(min)).toBe('2026-08-05');
    expect(min.getHours()).toBe(0);
  });

  it('allows today itself', () => {
    const today = new Date(2026, 7, 5, 14, 30);
    const min = minimumAvailableFrom(today);
    expect(min.getTime()).toBeLessThanOrEqual(today.getTime());
  });
});

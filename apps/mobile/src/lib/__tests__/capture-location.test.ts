/**
 * Purpose: Gate tests for the pure capture-location rules.
 * Why important: These rules gate anti-fraud (mocked GPS, weak accuracy) and
 *   the fast-capture path (warm fix reuse); regressions here corrupt listing
 *   GPS data or reintroduce the slow capture UX.
 * Used by: apps/mobile test lane (pnpm --filter @pataspace/mobile test).
 */
import {
  FRESH_FIX_MAX_AGE_MS,
  WEAK_ACCURACY_THRESHOLD_METERS,
  coordinateLabel,
  isFreshFix,
  isWeakGpsFix,
  pickAddressLabel,
} from '../capture-location';

describe('isFreshFix', () => {
  const now = 1_750_000_000_000;

  it('accepts a fix taken just now', () => {
    expect(isFreshFix(now, now)).toBe(true);
  });

  it('accepts a fix exactly at the max age', () => {
    expect(isFreshFix(now - FRESH_FIX_MAX_AGE_MS, now)).toBe(true);
  });

  it('rejects a fix older than the max age', () => {
    expect(isFreshFix(now - FRESH_FIX_MAX_AGE_MS - 1, now)).toBe(false);
  });

  it('rejects a future-dated fix (bad clock forces a live fix)', () => {
    expect(isFreshFix(now + 1_000, now)).toBe(false);
  });

  it('honours a custom max age', () => {
    expect(isFreshFix(now - 3_000, now, 2_000)).toBe(false);
    expect(isFreshFix(now - 1_000, now, 2_000)).toBe(true);
  });
});

describe('isWeakGpsFix', () => {
  it('flags mocked locations regardless of accuracy', () => {
    expect(isWeakGpsFix({ mocked: true, accuracyMeters: 5 })).toBe(true);
  });

  it('flags accuracy worse than the threshold', () => {
    expect(
      isWeakGpsFix({ accuracyMeters: WEAK_ACCURACY_THRESHOLD_METERS + 1 }),
    ).toBe(true);
  });

  it('accepts accuracy exactly at the threshold', () => {
    expect(isWeakGpsFix({ accuracyMeters: WEAK_ACCURACY_THRESHOLD_METERS })).toBe(false);
  });

  it('accepts a strong, non-mocked fix', () => {
    expect(isWeakGpsFix({ mocked: false, accuracyMeters: 8 })).toBe(false);
  });

  it('does not flag unknown accuracy (null or undefined)', () => {
    expect(isWeakGpsFix({ accuracyMeters: null })).toBe(false);
    expect(isWeakGpsFix({ accuracyMeters: undefined })).toBe(false);
  });
});

describe('coordinateLabel', () => {
  it('formats to five decimal places', () => {
    expect(coordinateLabel(-1.2920659, 36.8219462)).toBe('-1.29207, 36.82195');
  });
});

describe('pickAddressLabel', () => {
  it('joins the first two usable parts', () => {
    expect(pickAddressLabel(['Kilimani', 'Ngong Road', 'Nairobi'])).toBe(
      'Kilimani, Ngong Road',
    );
  });

  it('skips null, undefined, and whitespace-only parts', () => {
    expect(pickAddressLabel([null, '  ', undefined, 'Nairobi'])).toBe('Nairobi');
  });

  it('returns null when nothing usable came back', () => {
    expect(pickAddressLabel([null, undefined, ' '])).toBeNull();
  });
});

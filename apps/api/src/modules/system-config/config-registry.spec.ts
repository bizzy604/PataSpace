/**
 * Purpose: Gate tests for the config registry's parse/validate helper.
 * Why important: parseConfigValue is the single gate that keeps an out-of-range
 *   or non-integer value from reaching the pricing resolver.
 * Used by: jest runner via apps/api jest config.
 */
import { findConfigKey, parseConfigValue } from './config-registry';

describe('parseConfigValue', () => {
  const intKey = findConfigKey('pricing.unlockBand2Br')!;
  const ratioKey = findConfigKey('pricing.successFeePct')!;

  it('accepts an in-range integer', () => {
    expect(parseConfigValue(intKey, 300)).toBe(300);
    expect(parseConfigValue(intKey, '300')).toBe(300);
  });

  it('rejects a non-integer for an int key', () => {
    expect(parseConfigValue(intKey, 300.5)).toBeNull();
  });

  it('accepts a ratio in [0,1] and rejects one outside it', () => {
    expect(parseConfigValue(ratioKey, 0.12)).toBe(0.12);
    expect(parseConfigValue(ratioKey, 1)).toBe(1);
    expect(parseConfigValue(ratioKey, 1.5)).toBeNull();
    expect(parseConfigValue(ratioKey, -0.1)).toBeNull();
  });

  it('rejects non-numbers', () => {
    expect(parseConfigValue(intKey, 'abc')).toBeNull();
    expect(parseConfigValue(intKey, NaN)).toBeNull();
  });

  it('returns undefined for an unknown key lookup', () => {
    expect(findConfigKey('pricing.nope')).toBeUndefined();
  });
});

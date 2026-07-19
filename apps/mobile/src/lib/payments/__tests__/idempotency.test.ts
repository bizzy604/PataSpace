import { newIdempotencyKey } from '../idempotency';

describe('newIdempotencyKey', () => {
  it('generates keys the API accepts (8-128 chars, topup prefix)', () => {
    const key = newIdempotencyKey();
    expect(key.startsWith('topup-')).toBe(true);
    expect(key.length).toBeGreaterThanOrEqual(8);
    expect(key.length).toBeLessThanOrEqual(128);
  });

  it('never repeats across many calls', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(1000);
  });

  it('falls back to timestamp+random when crypto.randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

    try {
      const key = newIdempotencyKey();
      expect(key.startsWith('topup-')).toBe(true);
      expect(key.length).toBeGreaterThanOrEqual(8);
      expect(newIdempotencyKey()).not.toBe(key);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
    }
  });
});

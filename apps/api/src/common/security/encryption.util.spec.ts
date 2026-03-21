import {
  decryptField,
  encryptField,
  hashLookupValue,
  hashSecretValue,
  normalizePhoneNumber,
} from './encryption.util';

describe('encryption utilities', () => {
  const key = '12345678901234567890123456789012';

  it('normalizes Kenyan phone numbers into +254 format', () => {
    expect(normalizePhoneNumber('0712345678')).toBe('+254712345678');
    expect(normalizePhoneNumber('254712345678')).toBe('+254712345678');
    expect(normalizePhoneNumber('+254712345678')).toBe('+254712345678');
  });

  it('creates stable lookup hashes', () => {
    expect(hashLookupValue('Test Value')).toBe(hashLookupValue('test value'));
  });

  it('creates deterministic secret hashes', () => {
    expect(hashSecretValue('secret')).toBe(hashSecretValue('secret'));
  });

  it('round-trips encrypted fields', () => {
    const plaintext = '123 Argwings Kodhek Road';
    const encrypted = encryptField(plaintext, key);

    expect(encrypted).not.toBe(plaintext);
    expect(decryptField(encrypted, key)).toBe(plaintext);
  });
});

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(rawKey: string) {
  return createHash('sha256').update(rawKey).digest();
}

export function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim().replace(/\s+/g, '');

  if (trimmed.startsWith('+254')) {
    return trimmed;
  }

  if (trimmed.startsWith('254')) {
    return `+${trimmed}`;
  }

  if (trimmed.startsWith('0')) {
    return `+254${trimmed.slice(1)}`;
  }

  return trimmed;
}

export function hashLookupValue(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function hashSecretValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function encryptField(plaintext: string, rawKey: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, getEncryptionKey(rawKey), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

export function decryptField(ciphertext: string, rawKey: string) {
  const [ivHex, encryptedHex, authTagHex] = ciphertext.split(':');

  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error('Invalid encrypted payload format.');
  }

  const decipher = createDecipheriv(
    AES_ALGORITHM,
    getEncryptionKey(rawKey),
    Buffer.from(ivHex, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Purpose: Gate tests for boot-time environment validation rules.
 * Why important: Proves misconfigured production envs (sandbox providers,
 *   sandbox storage URLs, missing secrets) fail at startup instead of
 *   breaking user flows silently.
 * Used by: apps/api unit test lane (pnpm --filter @pataspace/api test:unit).
 */
import { envSchema } from './env.validation';

describe('envSchema', () => {
  const baseEnv = {
    APP_ENCRYPTION_KEY: '12345678901234567890123456789012',
    APP_NAME: 'pataspace-api',
    APP_BASE_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/pataspace',
    JWT_REFRESH_SECRET: 'test-refresh-secret-value-12345',
    JWT_SECRET: 'test-jwt-secret-value-12345',
    NODE_ENV: 'test',
    PORT: '3000',
  };

  it('accepts development and test URLs without HTTPS', () => {
    const result = envSchema.safeParse(baseEnv);

    expect(result.success).toBe(true);
  });

  it('requires ALLOWED_ORIGINS in production', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      NODE_ENV: 'production',
      APP_BASE_URL: 'https://api.pataspace.example',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['ALLOWED_ORIGINS'],
        }),
      ]),
    );
  });

  it('requires HTTPS for APP_BASE_URL in production', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      NODE_ENV: 'production',
      ALLOWED_ORIGINS: 'https://app.pataspace.example',
      APP_BASE_URL: 'http://api.pataspace.example',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['APP_BASE_URL'],
        }),
      ]),
    );
  });

  const validProductionEnv = {
    ...baseEnv,
    NODE_ENV: 'production',
    ALLOWED_ORIGINS: 'https://app.pataspace.example',
    APP_BASE_URL: 'https://api.pataspace.example',
    SMS_PROVIDER: 'africastalking',
    AT_USERNAME: 'pataspace',
    AT_API_KEY: 'at-api-key',
    STORAGE_PROVIDER: 's3',
    AWS_S3_BUCKET: 'pataspace-media',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'prod-access-key',
    AWS_SECRET_ACCESS_KEY: 'prod-secret-key',
  };

  it('accepts a fully-configured production env', () => {
    const result = envSchema.safeParse(validProductionEnv);

    expect(result.success).toBe(true);
  });

  it('rejects sandbox SMS in production (fixed OTP would be usable)', () => {
    const result = envSchema.safeParse({
      ...validProductionEnv,
      SMS_PROVIDER: 'sandbox',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['SMS_PROVIDER'] }),
      ]),
    );
  });

  it('rejects sandbox storage in production (upload URLs resolve to a fake host)', () => {
    const result = envSchema.safeParse({
      ...validProductionEnv,
      STORAGE_PROVIDER: 'sandbox',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['STORAGE_PROVIDER'] }),
      ]),
    );
  });

  it('rejects sandbox-storage base URLs in production (stored media would 404)', () => {
    const result = envSchema.safeParse({
      ...validProductionEnv,
      STORAGE_PUBLIC_BASE_URL: 'https://api.pataspace.example/sandbox-storage',
      STORAGE_CDN_BASE_URL: 'https://api.pataspace.example/sandbox-storage',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['STORAGE_PUBLIC_BASE_URL'] }),
        expect.objectContaining({ path: ['STORAGE_CDN_BASE_URL'] }),
      ]),
    );
  });

  it('still allows sandbox storage outside production', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      STORAGE_PROVIDER: 'sandbox',
    });

    expect(result.success).toBe(true);
  });

  it('requires a callback secret and HTTPS callback URLs in live M-Pesa mode', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      MPESA_MODE: 'live',
      MPESA_BASE_URL: 'https://api.safaricom.co.ke',
      MPESA_CALLBACK_URL: 'http://api.pataspace.example/api/v1/payments/mpesa-callback',
      MPESA_CONSUMER_KEY: 'consumer-key',
      MPESA_CONSUMER_SECRET: 'consumer-secret',
      MPESA_INITIATOR_NAME: 'initiator',
      MPESA_PASSKEY: 'passkey',
      MPESA_RESULT_URL: 'https://api.pataspace.example/api/v1/payments/mpesa-result',
      MPESA_SECURITY_CREDENTIAL: 'credential',
      MPESA_SHORTCODE: '174379',
      MPESA_TIMEOUT_URL: 'https://api.pataspace.example/api/v1/payments/mpesa-timeout',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['MPESA_CALLBACK_SECRET'],
        }),
        expect.objectContaining({
          path: ['MPESA_CALLBACK_URL'],
        }),
      ]),
    );
  });

  describe('M-Pesa callback URL contracts', () => {
    it('rejects callback URLs pointing at routes that are not registered', () => {
      // The exact incident this guards: templates shipped /mpesa-result and
      // /mpesa-timeout, which 404 — the real routes are /mpesa-b2c-callback
      // and /mpesa-b2c-timeout.
      const result = envSchema.safeParse({
        ...baseEnv,
        MPESA_RESULT_URL: 'http://localhost:3000/api/v1/payments/mpesa-result',
        MPESA_TIMEOUT_URL: 'http://localhost:3000/api/v1/payments/mpesa-timeout',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['MPESA_RESULT_URL'] }),
          expect.objectContaining({ path: ['MPESA_TIMEOUT_URL'] }),
        ]),
      );
    });

    it('requires the query token on every callback URL once the secret is set', () => {
      const result = envSchema.safeParse({
        ...baseEnv,
        MPESA_CALLBACK_SECRET: 'a-long-callback-secret-value',
        MPESA_CALLBACK_URL: 'http://localhost:3000/api/v1/payments/mpesa-callback',
        MPESA_RESULT_URL:
          'http://localhost:3000/api/v1/payments/mpesa-b2c-callback?token=wrong-secret',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['MPESA_CALLBACK_URL'] }),
          expect.objectContaining({ path: ['MPESA_RESULT_URL'] }),
        ]),
      );
    });

    it('accepts correctly-routed callback URLs carrying the secret token', () => {
      const result = envSchema.safeParse({
        ...baseEnv,
        MPESA_CALLBACK_SECRET: 'a-long-callback-secret-value',
        MPESA_CALLBACK_URL:
          'http://localhost:3000/api/v1/payments/mpesa-callback?token=a-long-callback-secret-value',
        MPESA_RESULT_URL:
          'http://localhost:3000/api/v1/payments/mpesa-b2c-callback?token=a-long-callback-secret-value',
        MPESA_TIMEOUT_URL:
          'http://localhost:3000/api/v1/payments/mpesa-b2c-timeout?token=a-long-callback-secret-value',
      });

      expect(result.success).toBe(true);
    });
  });
});

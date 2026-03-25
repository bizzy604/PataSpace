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
});

/**
 * Purpose: Boot-time environment validation for the API (zod schema + refinements).
 * Why important: Misconfigured providers must fail loudly at startup, not as
 *   silent runtime breakage on user-facing flows (OTP, uploads, payments).
 * Used by: ConfigModule via validateEnv in app bootstrap.
 */
import { z } from 'zod';
import {
  requireFields,
  requireHttps,
  requireMpesaCallbackContracts,
} from './env.refinements';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default('pataspace-api'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),
  SWAGGER_PATH: z.string().min(1).default('docs'),
  SWAGGER_TITLE: z.string().min(1).default('PataSpace API'),
  SWAGGER_DESCRIPTION: z.string().min(1).default('OpenAPI documentation for the PataSpace backend service.'),
  SWAGGER_VERSION: z.string().min(1).default('0.1.0'),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().or(z.literal('')),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().min(2).default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_TOKEN_TRANSPORT: z.enum(['json']).default('json'),
  ALLOWED_ORIGINS: z.string().optional(),
  HTTP_TRUST_PROXY: z.string().optional(),
  REQUEST_ID_HEADER: z.string().min(1).default('x-request-id'),
  APP_ENCRYPTION_KEY: z.string().min(32),
  APP_HASH_PEPPER: z.string().min(16).optional(),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  OTP_SANDBOX_CODE: z.string().regex(/^\d{4,6}$/).default('123456'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_DEFAULT_LIMIT: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  QUEUE_PREFIX: z.string().min(1).default('pataspace'),
  SMS_PROVIDER: z.enum(['sandbox', 'africastalking']).default('sandbox'),
  EMAIL_PROVIDER: z.enum(['sandbox', 'resend']).default('sandbox'),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  STORAGE_PROVIDER: z.enum(['sandbox', 's3']).default('sandbox'),
  MPESA_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  AT_BASE_URL: z.string().url().default('https://api.africastalking.com'),
  AT_USERNAME: z.string().min(1).optional(),
  AT_API_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET: z.string().min(1).optional(),
  AWS_REGION: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  STORAGE_CDN_BASE_URL: z.string().url().optional(),
  SANDBOX_SMS_FAIL_OTP: z.enum(['true', 'false']).optional(),
  SANDBOX_SMS_FAIL_MESSAGE: z.enum(['true', 'false']).optional(),
  SANDBOX_STORAGE_FAIL_CREATE_UPLOAD_URL: z.enum(['true', 'false']).optional(),
  SANDBOX_STORAGE_FAIL_CONFIRM_UPLOAD: z.enum(['true', 'false']).optional(),
  SANDBOX_STORAGE_FAIL_DELETE_OBJECT: z.enum(['true', 'false']).optional(),
  SANDBOX_MPESA_FAIL_STK_PUSH: z.enum(['true', 'false']).optional(),
  SANDBOX_MPESA_FAIL_B2C: z.enum(['true', 'false']).optional(),
  MPESA_BASE_URL: z.string().url().optional(),
  MPESA_CONSUMER_KEY: z.string().min(1).optional(),
  MPESA_CONSUMER_SECRET: z.string().min(1).optional(),
  MPESA_SHORTCODE: z.string().min(1).optional(),
  MPESA_PASSKEY: z.string().min(1).optional(),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  MPESA_CALLBACK_SECRET: z.string().min(16).optional(),
  MPESA_INITIATOR_NAME: z.string().min(1).optional(),
  MPESA_SECURITY_CREDENTIAL: z.string().min(1).optional(),
  MPESA_RESULT_URL: z.string().url().optional(),
  MPESA_TIMEOUT_URL: z.string().url().optional(),
}).superRefine((value, context) => {
  const allowedOrigins = value.ALLOWED_ORIGINS
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

  if (value.NODE_ENV === 'production') {
    if (allowedOrigins.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOWED_ORIGINS'],
        message: 'ALLOWED_ORIGINS must be configured in production.',
      });
    }

    requireHttps(context, value.APP_BASE_URL, 'APP_BASE_URL');

    // Sandbox SMS returns a fixed OTP (OTP_SANDBOX_CODE), and verify-otp mints a
    // full session on OTP alone. Allowing sandbox SMS in production would make
    // phone ownership forgeable, so a real provider is mandatory there.
    if (value.SMS_PROVIDER !== 'africastalking') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMS_PROVIDER'],
        message: 'SMS_PROVIDER must be "africastalking" in production; sandbox uses a fixed OTP.',
      });
    }

    // Sandbox storage mints upload URLs on a host that does not exist
    // (sandbox-storage.pataspace.local), so every media upload from a real
    // device dies at DNS and listing submission is guaranteed broken.
    if (value.STORAGE_PROVIDER !== 's3') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_PROVIDER'],
        message:
          'STORAGE_PROVIDER must be "s3" in production; sandbox upload URLs resolve to a fake host.',
      });
    }

    // A base URL pointing at /sandbox-storage combined with the s3 provider
    // stores media URLs that 404 forever. Unset these to fall back to the
    // real bucket URL, or point them at a CDN in front of the bucket.
    for (const field of ['STORAGE_PUBLIC_BASE_URL', 'STORAGE_CDN_BASE_URL'] as const) {
      if (value[field]?.includes('/sandbox-storage')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} must not point at /sandbox-storage in production; unset it or use the bucket/CDN URL.`,
        });
      }
    }
  }

  if (value.SMS_PROVIDER === 'africastalking') {
    requireFields(context, value, ['AT_USERNAME', 'AT_API_KEY']);
  }

  if (value.EMAIL_PROVIDER === 'resend') {
    requireFields(context, value, ['RESEND_API_KEY']);
  }

  if (value.STORAGE_PROVIDER === 's3') {
    requireFields(context, value, [
      'AWS_S3_BUCKET',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
    ]);
  }

  if (value.MPESA_MODE === 'live') {
    requireFields(context, value, [
      'MPESA_BASE_URL',
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'MPESA_SHORTCODE',
      'MPESA_PASSKEY',
      'MPESA_CALLBACK_URL',
      'MPESA_CALLBACK_SECRET',
      'MPESA_INITIATOR_NAME',
      'MPESA_SECURITY_CREDENTIAL',
      'MPESA_RESULT_URL',
      'MPESA_TIMEOUT_URL',
    ]);

    // Live M-Pesa mode handles real money: the Daraja API and every callback it
    // posts to must be HTTPS, regardless of NODE_ENV. Safaricom rejects non-HTTPS
    // callback URLs in live mode, so a localhost/http address here is always a
    // misconfiguration. (Sandbox mode keeps the relaxed localhost/ngrok behaviour.)
    requireHttps(context, value.MPESA_BASE_URL, 'MPESA_BASE_URL');
    requireHttps(context, value.MPESA_CALLBACK_URL, 'MPESA_CALLBACK_URL');
    requireHttps(context, value.MPESA_RESULT_URL, 'MPESA_RESULT_URL');
    requireHttps(context, value.MPESA_TIMEOUT_URL, 'MPESA_TIMEOUT_URL');
  }

  // Applies in every mode: a misrouted callback URL starves payments silently.
  requireMpesaCallbackContracts(context, value);
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (result.success) {
    return result.data;
  }

  const missingKeys = result.error.issues
    .filter((issue) => issue.code === 'invalid_type' && issue.received === 'undefined')
    .map((issue) => issue.path.join('.'));

  const helpMessage =
    missingKeys.length > 0
      ? `Missing required environment variables: ${missingKeys.join(', ')}. Copy apps/api/.env.example to apps/api/.env and fill in the values.`
      : 'Environment validation failed. Check apps/api/.env against apps/api/.env.example.';

  console.error(JSON.stringify(result.error.issues, null, 2));
throw new Error(helpMessage);
}

import { z } from 'zod';

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
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  OTP_SANDBOX_CODE: z.string().regex(/^\d{4,6}$/).default('123456'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_DEFAULT_LIMIT: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  QUEUE_PREFIX: z.string().min(1).default('pataspace'),
  SMS_PROVIDER: z.enum(['sandbox', 'africastalking']).default('sandbox'),
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
  }

  if (value.SMS_PROVIDER === 'africastalking') {
    requireFields(context, value, ['AT_USERNAME', 'AT_API_KEY']);
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

    requireHttps(context, value.MPESA_BASE_URL, 'MPESA_BASE_URL');
    requireHttps(context, value.MPESA_CALLBACK_URL, 'MPESA_CALLBACK_URL');
    requireHttps(context, value.MPESA_RESULT_URL, 'MPESA_RESULT_URL');
    requireHttps(context, value.MPESA_TIMEOUT_URL, 'MPESA_TIMEOUT_URL');
  }
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

  throw new Error(helpMessage);
}

function requireFields(
  context: z.RefinementCtx,
  value: Record<string, string | number | undefined>,
  fields: string[],
) {
  for (const field of fields) {
    if (value[field] !== undefined && value[field] !== '') {
      continue;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [field],
      message: `${field} is required for the selected provider configuration.`,
    });
  }
}

function requireHttps(
  context: z.RefinementCtx,
  value: string | undefined,
  field: string,
) {
  if (!value) {
    return;
  }

  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol === 'https:') {
      return;
    }
  } catch {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: [field],
    message: `${field} must use HTTPS in the selected environment.`,
  });
}

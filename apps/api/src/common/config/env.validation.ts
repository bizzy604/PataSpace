import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default('pataspace-api'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().or(z.literal('')),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  REFRESH_TOKEN_TRANSPORT: z.enum(['json']).default('json'),
  ALLOWED_ORIGINS: z.string().optional(),
  REQUEST_ID_HEADER: z.string().min(1).default('x-request-id'),
  APP_ENCRYPTION_KEY: z.string().min(32),
  SMS_PROVIDER: z.enum(['sandbox', 'africastalking']).default('sandbox'),
  STORAGE_PROVIDER: z.enum(['sandbox', 's3']).default('sandbox'),
  MPESA_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  MPESA_BASE_URL: z.string().url(),
  MPESA_CONSUMER_KEY: z.string().min(1),
  MPESA_CONSUMER_SECRET: z.string().min(1),
  MPESA_SHORTCODE: z.string().min(1),
  MPESA_PASSKEY: z.string().min(1),
  MPESA_CALLBACK_URL: z.string().url(),
  AT_USERNAME: z.string().min(1),
  AT_API_KEY: z.string().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}

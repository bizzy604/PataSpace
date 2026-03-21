const parseCsv = (value: string | undefined) =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'pataspace-api',
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    baseUrl: process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  },
  docs: {
    enabled:
      process.env.SWAGGER_ENABLED !== undefined
        ? process.env.SWAGGER_ENABLED === 'true'
        : process.env.NODE_ENV !== 'production',
    path: process.env.SWAGGER_PATH ?? 'docs',
    title: process.env.SWAGGER_TITLE ?? 'PataSpace API',
    description:
      process.env.SWAGGER_DESCRIPTION ??
      'OpenAPI documentation for the PataSpace backend service.',
    version: process.env.SWAGGER_VERSION ?? '0.1.0',
  },
  http: {
    globalPrefix: 'api/v1',
    requestIdHeader: process.env.REQUEST_ID_HEADER ?? 'x-request-id',
    allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshTokenTransport: process.env.REFRESH_TOKEN_TRANSPORT ?? 'json',
    encryptionKey: process.env.APP_ENCRYPTION_KEY,
  },
  idempotency: {
    ttlSeconds: Number(process.env.IDEMPOTENCY_TTL_SECONDS ?? 86_400),
    inProgressTtlSeconds: Number(process.env.IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS ?? 120),
  },
  rateLimit: {
    default: {
      limit: Number(process.env.RATE_LIMIT_DEFAULT_LIMIT ?? 100),
      ttlSeconds: Number(process.env.RATE_LIMIT_DEFAULT_TTL_SECONDS ?? 60),
    },
  },
  infrastructure: {
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB ?? 0),
    },
    queue: {
      prefix: process.env.QUEUE_PREFIX ?? 'pataspace',
    },
    sms: {
      provider: process.env.SMS_PROVIDER ?? 'sandbox',
      baseUrl: process.env.AT_BASE_URL ?? 'https://api.africastalking.com',
      username: process.env.AT_USERNAME ?? 'sandbox',
      apiKey: process.env.AT_API_KEY,
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER ?? 'sandbox',
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      presignTtlSeconds: Number(process.env.AWS_S3_PRESIGN_TTL_SECONDS ?? 900),
    },
    mpesa: {
      mode: process.env.MPESA_MODE ?? 'sandbox',
      baseUrl: process.env.MPESA_BASE_URL,
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
      initiatorName: process.env.MPESA_INITIATOR_NAME,
      securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      resultUrl:
        process.env.MPESA_RESULT_URL ?? process.env.MPESA_CALLBACK_URL,
      timeoutUrl:
        process.env.MPESA_TIMEOUT_URL ?? process.env.MPESA_CALLBACK_URL,
    },
  },
});

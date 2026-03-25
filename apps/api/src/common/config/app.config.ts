const parseCsv = (value: string | undefined) =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

const parseTrustProxy = (value: string | undefined) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return false;
  }

  const normalizedLowerValue = normalizedValue.toLowerCase();

  if (normalizedLowerValue === 'true') {
    return true;
  }

  if (normalizedLowerValue === 'false') {
    return false;
  }

  if (/^\d+$/.test(normalizedValue)) {
    return Number(normalizedValue);
  }

  const entries = parseCsv(normalizedValue);
  return entries.length <= 1 ? (entries[0] ?? false) : entries;
};

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
    trustProxy: parseTrustProxy(process.env.HTTP_TRUST_PROXY),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
    refreshTokenTransport: process.env.REFRESH_TOKEN_TRANSPORT ?? 'json',
    encryptionKey: process.env.APP_ENCRYPTION_KEY,
    otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
    otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),
    sandboxOtpCode: process.env.OTP_SANDBOX_CODE ?? '123456',
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
      sandbox: {
        failMessage: process.env.SANDBOX_SMS_FAIL_MESSAGE === 'true',
        failOtp: process.env.SANDBOX_SMS_FAIL_OTP === 'true',
      },
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER ?? 'sandbox',
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      presignTtlSeconds: Number(process.env.AWS_S3_PRESIGN_TTL_SECONDS ?? 900),
      publicBaseUrl:
        process.env.STORAGE_PUBLIC_BASE_URL ??
        (process.env.STORAGE_PROVIDER === 's3' &&
        process.env.AWS_S3_BUCKET &&
        process.env.AWS_REGION
          ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
          : `${process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/sandbox-storage`),
      cdnBaseUrl:
        process.env.STORAGE_CDN_BASE_URL ??
        process.env.STORAGE_PUBLIC_BASE_URL ??
        (process.env.STORAGE_PROVIDER === 's3' &&
        process.env.AWS_S3_BUCKET &&
        process.env.AWS_REGION
          ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
          : `${process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/sandbox-storage`),
      sandbox: {
        failConfirmUpload: process.env.SANDBOX_STORAGE_FAIL_CONFIRM_UPLOAD === 'true',
        failCreateUploadUrl: process.env.SANDBOX_STORAGE_FAIL_CREATE_UPLOAD_URL === 'true',
        failDeleteObject: process.env.SANDBOX_STORAGE_FAIL_DELETE_OBJECT === 'true',
      },
    },
    mpesa: {
      mode: process.env.MPESA_MODE ?? 'sandbox',
      baseUrl: process.env.MPESA_BASE_URL,
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
      callbackSecret: process.env.MPESA_CALLBACK_SECRET,
      initiatorName: process.env.MPESA_INITIATOR_NAME,
      securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      resultUrl:
        process.env.MPESA_RESULT_URL ?? process.env.MPESA_CALLBACK_URL,
      timeoutUrl:
        process.env.MPESA_TIMEOUT_URL ?? process.env.MPESA_CALLBACK_URL,
      sandbox: {
        failB2c: process.env.SANDBOX_MPESA_FAIL_B2C === 'true',
        failStkPush: process.env.SANDBOX_MPESA_FAIL_STK_PUSH === 'true',
      },
    },
  },
});

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
  infrastructure: {
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
    },
    sms: {
      provider: process.env.SMS_PROVIDER ?? 'sandbox',
      username: process.env.AT_USERNAME ?? 'sandbox',
      apiKey: process.env.AT_API_KEY,
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER ?? 'sandbox',
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    mpesa: {
      mode: process.env.MPESA_MODE ?? 'sandbox',
      baseUrl: process.env.MPESA_BASE_URL,
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
    },
  },
});

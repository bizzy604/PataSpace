import { Throttle } from '@nestjs/throttler';

export const rateLimitProfiles = {
  authRegister: { limit: 3, ttlSeconds: 3600 },
  authVerifyOtp: { limit: 3, ttlSeconds: 3600 },
  authLogin: { limit: 5, ttlSeconds: 3600 },
  listingCreate: { limit: 10, ttlSeconds: 86400 },
  unlockCreate: { limit: 10, ttlSeconds: 86400 },
  creditPurchase: { limit: 10, ttlSeconds: 86400 },
  uploadCreate: { limit: 100, ttlSeconds: 3600 },
  uploadConfirm: { limit: 100, ttlSeconds: 3600 },
} as const;

export type RateLimitProfile = keyof typeof rateLimitProfiles;

export const ApiRateLimit = (profile: RateLimitProfile) => {
  const selectedProfile = rateLimitProfiles[profile];

  return Throttle({
    default: {
      limit: selectedProfile.limit,
      ttl: selectedProfile.ttlSeconds * 1000,
      blockDuration: selectedProfile.ttlSeconds * 1000,
    },
  });
};

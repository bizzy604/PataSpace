import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_OPTIONS_KEY = 'idempotency-options';

export type IdempotencyOptions = {
  requireHeader?: boolean;
  replayStatusCode?: number;
  ttlSeconds?: number;
};

export const Idempotent = (options: IdempotencyOptions = {}) =>
  SetMetadata(IDEMPOTENCY_OPTIONS_KEY, options);

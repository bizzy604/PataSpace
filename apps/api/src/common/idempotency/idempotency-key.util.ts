/**
 * Purpose: Transport-level validation of the client-supplied Idempotency-Key
 * header for money-creating endpoints.
 * Why important: the key is what makes a network retry safe; a missing or
 * degenerate key must be rejected before any money work starts.
 * Used by: payment.controller.ts (POST /credits/purchase).
 */
import { BadRequestException } from '@nestjs/common';

export function requireIdempotencyKey(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';

  if (trimmed.length < 8 || trimmed.length > 128) {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message:
        'Provide an Idempotency-Key header (8-128 characters, unique per purchase attempt) so retries cannot double-charge.',
    });
  }

  return trimmed;
}

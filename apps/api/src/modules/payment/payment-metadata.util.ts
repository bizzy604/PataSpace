/**
 * Purpose: Pure helpers for reading and merging Prisma JSON metadata on CreditTransaction.
 * Why important: Centralises the JsonValue gymnastics to one place, preventing duplication.
 * Used by: mpesa-purchase.service.ts, stellar-purchase.service.ts, payment-fulfillment.service.ts
 */

import { Prisma } from '@prisma/client';

export function mergeMetadata(
  existing: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>,
): Prisma.InputJsonObject {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Prisma.InputJsonObject)
      : {};

  return { ...base, ...(patch as Prisma.InputJsonObject) };
}

export function readStringMetadata(metadata: Prisma.JsonValue | null, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Prisma.JsonObject)[key];
  return typeof value === 'string' ? value : null;
}

export function readNumberMetadata(metadata: Prisma.JsonValue | null, key: string): number | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Prisma.JsonObject)[key];
  return typeof value === 'number' ? value : null;
}

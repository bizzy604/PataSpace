/**
 * Purpose: Small shared helpers for the unlock module (JSON metadata merging
 * for credit-transaction audit trails).
 * Why important: refund and unlock paths both patch transaction metadata;
 * one implementation keeps the merge semantics identical.
 * Used by: UnlockService, UnlockRefundService.
 */
import { Prisma } from '@prisma/client';

export function mergeTransactionMetadata(
  existing: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>,
): Prisma.InputJsonObject {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Prisma.InputJsonObject)
      : {};

  return {
    ...base,
    ...(patch as Prisma.InputJsonObject),
  };
}

/**
 * Purpose: Pure rules for the confirmation loop — which dispute states block
 * progress, when a unlock is settleable (both sides in, not refunded, no live
 * dispute), and which side an auto-confirmation must attribute.
 * Why important: these predicates gate the payout trigger and the listing lock.
 * Keeping them pure and DB-free means the money rules are testable without a
 * database and cannot drift between the manual path and the 14-day job.
 * Used by: SettlementService, StaleConfirmationService, ConfirmationService,
 * confirmation-eligibility.policy.spec.ts.
 */
import { ConfirmationSide as PrismaConfirmationSide, DisputeStatus } from '@prisma/client';
import { ConfirmationSide as ContractConfirmationSide } from '@pataspace/contracts';

export const AUTO_CONFIRM_AFTER_DAYS = 14;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * OPEN and INVESTIGATING mean an admin is still deciding whether this handover
 * happened at all. Settling or locking under either would pay out (and take a
 * listing off the market) on a deal that may be reversed.
 */
export const BLOCKING_DISPUTE_STATUSES = new Set<DisputeStatus>([
  DisputeStatus.OPEN,
  DisputeStatus.INVESTIGATING,
]);

export type DisputeState = { status: DisputeStatus } | null;

export function hasBlockingDispute(dispute: DisputeState): boolean {
  return Boolean(dispute && BLOCKING_DISPUTE_STATUSES.has(dispute.status));
}

export type SettlementCandidate = {
  isRefunded: boolean;
  confirmations: unknown[];
  dispute: DisputeState;
};

/**
 * Two confirmations is the whole trigger: one per side, enforced unique by the
 * schema. A refunded unlock is already unwound, so it must never settle.
 */
export function isSettleable(unlock: SettlementCandidate | null): boolean {
  if (!unlock) {
    return false;
  }

  return (
    !unlock.isRefunded && unlock.confirmations.length >= 2 && !hasBlockingDispute(unlock.dispute)
  );
}

export function staleConfirmationCutoff(now: Date): Date {
  return new Date(now.getTime() - AUTO_CONFIRM_AFTER_DAYS * DAY_IN_MS);
}

export type AutoConfirmCandidate = {
  confirmations: { side: PrismaConfirmationSide }[];
  dispute: DisputeState;
};

/**
 * Auto-confirm applies only to a strictly one-sided unlock. Zero confirmations
 * means nobody claims the handover happened; two means it is already settled.
 */
export function isAutoConfirmable(unlock: AutoConfirmCandidate): boolean {
  return unlock.confirmations.length === 1 && !hasBlockingDispute(unlock.dispute);
}

/** The side that never confirmed is the one the 14-day job attributes. */
export function missingConfirmationSide(
  existingSide: PrismaConfirmationSide | undefined,
): ContractConfirmationSide {
  return existingSide === PrismaConfirmationSide.INCOMING_TENANT
    ? ContractConfirmationSide.OUTGOING_TENANT
    : ContractConfirmationSide.INCOMING_TENANT;
}

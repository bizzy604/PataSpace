/**
 * Purpose: Pure success-fee arithmetic: remaining balance, poster share of
 * collected, commission eligibility date, and the contract summary mapper.
 * Why important: money math stays deterministic and dependency-free, shared
 * between fee creation and settlement without dragging in Prisma or Nest.
 * Used by: success-fee.service.ts.
 */
import { SuccessFeeStatus as PrismaSuccessFeeStatus } from '@prisma/client';
import {
  ConfirmationSuccessFee,
  SuccessFeeStatus as ContractSuccessFeeStatus,
} from '@pataspace/contracts';
import { posterShareKes, PricingConfig } from '../../listing/domain/pricing.policy';

export const COMMISSION_WAIT_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SuccessFeeFigures = {
  feeDueKes: number;
  creditsApplied: number;
  cashCollectedKes: number;
};

export function remainingFeeKes(fee: SuccessFeeFigures) {
  return Math.max(0, fee.feeDueKes - fee.creditsApplied - fee.cashCollectedKes);
}

export function posterShareOfCollected(fee: SuccessFeeFigures, config: PricingConfig) {
  return posterShareKes(
    Math.min(fee.creditsApplied + fee.cashCollectedKes, fee.feeDueKes),
    config,
  );
}

export function commissionEligibleAt(confirmations: Array<{ confirmedAt: Date }>) {
  const latestConfirmation = confirmations.reduce<Date | null>(
    (latest, confirmation) =>
      !latest || confirmation.confirmedAt.getTime() > latest.getTime()
        ? confirmation.confirmedAt
        : latest,
    null,
  );

  const baseTime = latestConfirmation ?? new Date();
  return new Date(baseTime.getTime() + COMMISSION_WAIT_DAYS * DAY_IN_MS);
}

export function toSuccessFeeSummary(
  fee: SuccessFeeFigures & { status: PrismaSuccessFeeStatus },
): ConfirmationSuccessFee {
  return {
    feeDueKes: fee.feeDueKes,
    creditsApplied: fee.creditsApplied,
    cashCollectedKes: fee.cashCollectedKes,
    remainingKes: remainingFeeKes(fee),
    status: fee.status as unknown as ContractSuccessFeeStatus,
  };
}

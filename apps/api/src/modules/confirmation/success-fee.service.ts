/**
 * Purpose: Success-fee capture (spec v1.1 sections 4.3/4.4): on a confirmed
 * move-in, snapshots the fee, applies the mover's already-spent unlock
 * credits toward it, and creates the fee-backed poster commission at 70% of
 * collected-so-far. Also answers the mover-gating question.
 * Why important: this is the revenue engine's booking step. Wallet
 * settlement lives in SuccessFeeSettlementService; pure fee math lives in
 * domain/success-fee.math.ts.
 * Used by: ConfirmationService (fee creation on confirm), UnlockService
 * gating via hasUnsettledFee.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  SuccessFeeStatus as PrismaSuccessFeeStatus,
} from '@prisma/client';
import { ConfirmationSuccessFee } from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  computeSuccessFeeKes,
  DEFAULT_PRICING_CONFIG,
  PricingConfig,
} from '../listing/domain/pricing.policy';
import {
  commissionEligibleAt,
  posterShareOfCollected,
  toSuccessFeeSummary,
} from './domain/success-fee.math';

export type EligibleUnlock = {
  id: string;
  buyerId: string;
  creditsSpent: number;
  listing: {
    id: string;
    userId: string;
    monthlyRent: number;
    successFeeKes: number;
  };
  confirmations: Array<{ confirmedAt: Date }>;
};

@Injectable()
export class SuccessFeeService {
  private readonly pricingConfig: PricingConfig;

  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.pricingConfig =
      configService.get<PricingConfig>('pricing') ?? DEFAULT_PRICING_CONFIG;
  }

  // Creates the fee row (idempotent) and the fee-backed commission for a
  // move-in that just became fully confirmed. The mover's already-spent
  // unlock credits are captured toward the fee; no wallet movement happens.
  async ensureForConfirmedUnlock(unlock: EligibleUnlock): Promise<ConfirmationSuccessFee> {
    const feeDueKes =
      unlock.listing.successFeeKes > 0
        ? unlock.listing.successFeeKes
        : computeSuccessFeeKes(unlock.listing.monthlyRent, this.pricingConfig);
    const creditsApplied = Math.min(unlock.creditsSpent, feeDueKes);
    const remainingKes = feeDueKes - creditsApplied;
    const status =
      remainingKes === 0 ? PrismaSuccessFeeStatus.SETTLED : PrismaSuccessFeeStatus.PARTIAL;

    const fee = await this.prismaService.$transaction(async (db) => {
      const row = await db.successFee.upsert({
        where: {
          unlockId: unlock.id,
        },
        update: {},
        create: {
          unlockId: unlock.id,
          listingId: unlock.listing.id,
          moverId: unlock.buyerId,
          feeDueKes,
          creditsApplied,
          status,
          settledAt: status === PrismaSuccessFeeStatus.SETTLED ? new Date() : null,
        },
      });

      await db.commission.upsert({
        where: {
          unlockId: unlock.id,
        },
        update: {
          amountKES: posterShareOfCollected(row, this.pricingConfig),
        },
        create: {
          unlockId: unlock.id,
          outgoingTenantId: unlock.listing.userId,
          amountKES: posterShareOfCollected(row, this.pricingConfig),
          status: CommissionStatus.PENDING,
          eligibleAt: commissionEligibleAt(unlock.confirmations),
        },
      });

      return row;
    });

    return toSuccessFeeSummary(fee);
  }

  // Account gating (spec section 4.4 signal C/D path): movers with an unpaid
  // fee balance cannot open new unlocks until they settle.
  async hasUnsettledFee(userId: string): Promise<boolean> {
    const unsettled = await this.prismaService.successFee.findFirst({
      where: {
        moverId: userId,
        status: {
          in: [PrismaSuccessFeeStatus.PENDING, PrismaSuccessFeeStatus.PARTIAL],
        },
      },
      select: {
        id: true,
      },
    });

    return unsettled !== null;
  }
}

/**
 * Purpose: Success-fee settlement (spec v1.1 sections 4.3/4.4): on a
 * confirmed move-in, snapshots the fee, applies the mover's unlock credits
 * toward it, keeps the poster commission at 70% of collected-so-far, and
 * settles the remaining balance from the mover's credit wallet.
 * Why important: this is the revenue engine and the incentive inversion that
 * kills viewing-fee economics; the poster is only paid on success, and the
 * mover's unlock is effectively free once they move in.
 * Used by: ConfirmationService (fee creation on confirm), ConfirmationController
 * (settle endpoint), UnlockService gating via hasUnsettledFee.
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  SuccessFeeStatus as PrismaSuccessFeeStatus,
} from '@prisma/client';
import {
  ConfirmationSuccessFee,
  SuccessFeeStatus as ContractSuccessFeeStatus,
} from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  computeSuccessFeeKes,
  DEFAULT_PRICING_CONFIG,
  posterShareKes,
  PricingConfig,
} from '../listing/domain/pricing.policy';
import { CreditService } from '../credit/credit.service';

const COMMISSION_WAIT_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
    private readonly creditService: CreditService,
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
          amountKES: this.posterShareOfCollected(row),
        },
        create: {
          unlockId: unlock.id,
          outgoingTenantId: unlock.listing.userId,
          amountKES: this.posterShareOfCollected(row),
          status: CommissionStatus.PENDING,
          eligibleAt: this.calculateEligibleAt(unlock.confirmations),
        },
      });

      return row;
    });

    return this.toSummary(fee);
  }

  // Applies the mover's wallet credits to the full remaining balance. The
  // mobile flow tops up the exact shortfall via the credit-purchase STK path
  // first, so settlement itself stays deterministic and idempotent.
  async settleFromCredits(userId: string, unlockId: string) {
    const fee = await this.prismaService.successFee.findUnique({
      where: {
        unlockId,
      },
    });

    if (!fee || fee.moverId !== userId) {
      throw new HttpException(
        {
          code: 'SUCCESS_FEE_NOT_FOUND',
          message: 'No success fee is due from you for this unlock',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const remainingKes = this.remainingKes(fee);

    if (remainingKes === 0) {
      return {
        fee: this.toSummary(fee),
        newBalance: await this.creditService.getCurrentBalanceValue(userId),
        alreadySettled: true,
      };
    }

    const balance = await this.creditService.getCurrentBalanceValue(userId);

    if (balance < remainingKes) {
      throw new HttpException(
        {
          code: 'INSUFFICIENT_CREDITS',
          message: `Top up ${remainingKes - balance} credits to settle your move-in fee`,
          details: {
            remainingKes,
            balance,
          },
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const settled = await this.prismaService.$transaction(async (db) => {
      const spendResult = await this.creditService.spendCredits(db, {
        userId,
        amount: remainingKes,
        description: `Move-in success fee for unlock ${unlockId}`,
        metadata: {
          successFeeId: fee.id,
          unlockId,
        },
      });

      const updatedFee = await db.successFee.update({
        where: {
          id: fee.id,
        },
        data: {
          cashCollectedKes: {
            increment: remainingKes,
          },
          status: PrismaSuccessFeeStatus.SETTLED,
          settledAt: new Date(),
        },
      });

      await db.commission.updateMany({
        where: {
          unlockId,
          status: {
            notIn: [CommissionStatus.PAID, CommissionStatus.CANCELLED],
          },
        },
        data: {
          amountKES: this.posterShareOfCollected(updatedFee),
        },
      });

      return {
        fee: updatedFee,
        newBalance: spendResult.balanceAfter,
      };
    });

    await this.creditService.invalidateBalanceCache(userId);

    return {
      fee: this.toSummary(settled.fee),
      newBalance: settled.newBalance,
      alreadySettled: false,
    };
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

  private remainingKes(fee: {
    feeDueKes: number;
    creditsApplied: number;
    cashCollectedKes: number;
  }) {
    return Math.max(0, fee.feeDueKes - fee.creditsApplied - fee.cashCollectedKes);
  }

  private posterShareOfCollected(fee: {
    feeDueKes: number;
    creditsApplied: number;
    cashCollectedKes: number;
  }) {
    return posterShareKes(
      Math.min(fee.creditsApplied + fee.cashCollectedKes, fee.feeDueKes),
      this.pricingConfig,
    );
  }

  private toSummary(fee: {
    feeDueKes: number;
    creditsApplied: number;
    cashCollectedKes: number;
    status: PrismaSuccessFeeStatus;
  }): ConfirmationSuccessFee {
    return {
      feeDueKes: fee.feeDueKes,
      creditsApplied: fee.creditsApplied,
      cashCollectedKes: fee.cashCollectedKes,
      remainingKes: this.remainingKes(fee),
      status: fee.status as unknown as ContractSuccessFeeStatus,
    };
  }

  private calculateEligibleAt(confirmations: Array<{ confirmedAt: Date }>) {
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
}

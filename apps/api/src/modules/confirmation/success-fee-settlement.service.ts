/**
 * Purpose: Settles the remaining success-fee balance from the mover's
 * credit wallet behind an atomic claim (spec v1.1 section 4.3).
 * Why important: this is the moment revenue is collected; the claim guards
 * on the exact figures the remaining amount was computed from, so a
 * double-tapped or retried settle can never charge the mover twice.
 * Used by: ConfirmationController (settle endpoint).
 */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  SuccessFeeStatus as PrismaSuccessFeeStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import {
  DEFAULT_PRICING_CONFIG,
  PricingConfig,
} from '../listing/domain/pricing.policy';
import { CreditService } from '../credit/credit.service';
import {
  posterShareOfCollected,
  remainingFeeKes,
  toSuccessFeeSummary,
} from './domain/success-fee.math';

@Injectable()
export class SuccessFeeSettlementService {
  private readonly pricingConfig: PricingConfig;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    configService: ConfigService,
  ) {
    this.pricingConfig =
      configService.get<PricingConfig>('pricing') ?? DEFAULT_PRICING_CONFIG;
  }

  async settleFromCredits(userId: string, unlockId: string) {
    const fee = await this.prismaService.successFee.findUnique({
      where: {
        unlockId,
      },
    });

    if (!fee || fee.moverId !== userId) {
      throw this.feeNotFound();
    }

    const remainingKes = remainingFeeKes(fee);

    if (remainingKes === 0) {
      return {
        fee: toSuccessFeeSummary(fee),
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
      // The claim guards on the exact figures `remainingKes` was computed
      // from — a concurrent settle (double-tap, mobile retry) changes them,
      // the claim matches zero rows, and a second spend becomes impossible.
      const claimed = await db.successFee.updateMany({
        where: {
          id: fee.id,
          status: {
            not: PrismaSuccessFeeStatus.SETTLED,
          },
          creditsApplied: fee.creditsApplied,
          cashCollectedKes: fee.cashCollectedKes,
        },
        data: {
          cashCollectedKes: {
            increment: remainingKes,
          },
          status: PrismaSuccessFeeStatus.SETTLED,
          settledAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        return null;
      }

      const spendResult = await this.creditService.spendCredits(db, {
        userId,
        amount: remainingKes,
        description: `Move-in success fee for unlock ${unlockId}`,
        metadata: {
          successFeeId: fee.id,
          unlockId,
        },
      });

      const updatedFee = await db.successFee.findUniqueOrThrow({
        where: {
          id: fee.id,
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
          amountKES: posterShareOfCollected(updatedFee, this.pricingConfig),
        },
      });

      return {
        fee: updatedFee,
        newBalance: spendResult.balanceAfter,
      };
    });

    if (!settled) {
      return this.reportConcurrentSettlement(userId, fee.id);
    }

    await this.creditService.invalidateBalanceCache(userId);

    return {
      fee: toSuccessFeeSummary(settled.fee),
      newBalance: settled.newBalance,
      alreadySettled: false,
    };
  }

  // Lost the claim: another request settled (or a refund removed the fee)
  // between our read and the transaction. Report reality; never re-spend.
  private async reportConcurrentSettlement(userId: string, feeId: string) {
    const current = await this.prismaService.successFee.findUnique({
      where: {
        id: feeId,
      },
    });

    if (!current) {
      throw this.feeNotFound();
    }

    if (remainingFeeKes(current) === 0) {
      return {
        fee: toSuccessFeeSummary(current),
        newBalance: await this.creditService.getCurrentBalanceValue(userId),
        alreadySettled: true,
      };
    }

    throw new ConflictException({
      code: 'SETTLEMENT_IN_PROGRESS',
      message:
        'This fee is being settled by another request. Check the fee status and retry if it is still due.',
    });
  }

  private feeNotFound() {
    return new HttpException(
      {
        code: 'SUCCESS_FEE_NOT_FOUND',
        message: 'No success fee is due from you for this unlock',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

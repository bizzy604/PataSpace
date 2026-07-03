/**
 * Purpose: Aggregates the v1.2 pilot metrics: landlord_declined refund share
 *   (spec section 4.2) and the mover-to-poster flywheel rate (section 4.6),
 *   plus success-fee collection state.
 * Why important: these two ratios are launch-gating signals — >20% landlord
 *   declines triggers the landlord-claim flow; <25% mover conversion is
 *   treated like a refund-rate spike.
 * Used by: AdminMetricsService.
 */
import { Injectable } from '@nestjs/common';
import { SuccessFeeStatus, UnlockDeadReason } from '@prisma/client';
import { AdminMetricsResponse } from '@pataspace/contracts';
import { PrismaService } from '../../../common/database/prisma.service';

type TrustAndFlywheelMetrics = Pick<
  AdminMetricsResponse,
  'trust' | 'flywheel' | 'successFees'
>;

@Injectable()
export class AdminTrustMetricsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMetrics(): Promise<TrustAndFlywheelMetrics> {
    const [
      refundsTotal,
      landlordDeclinedRefunds,
      confirmedMoveIns,
      seededListings,
      feeAggregates,
    ] = await Promise.all([
      this.prismaService.unlock.count({ where: { isRefunded: true } }),
      this.prismaService.unlock.count({
        where: { deadReason: UnlockDeadReason.LANDLORD_DECLINED },
      }),
      // A success-fee row is created exactly once per confirmed move-in.
      this.prismaService.successFee.count(),
      this.prismaService.listing.count({
        where: { seededFromConfirmationId: { not: null } },
      }),
      this.prismaService.successFee.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { creditsApplied: true, cashCollectedKes: true },
      }),
    ]);

    let partialCount = 0;
    let settledCount = 0;
    let collectedKes = 0;

    for (const row of feeAggregates) {
      collectedKes +=
        (row._sum.creditsApplied ?? 0) + (row._sum.cashCollectedKes ?? 0);

      if (row.status === SuccessFeeStatus.SETTLED) {
        settledCount = row._count._all;
      } else {
        partialCount += row._count._all;
      }
    }

    return {
      trust: {
        refundsTotal,
        landlordDeclinedRefunds,
        landlordDeclinedShare: this.ratio(landlordDeclinedRefunds, refundsTotal),
      },
      flywheel: {
        confirmedMoveIns,
        seededListings,
        moverToPosterRate: this.ratio(seededListings, confirmedMoveIns),
      },
      successFees: {
        partialCount,
        settledCount,
        collectedKes,
      },
    };
  }

  private ratio(numerator: number, denominator: number) {
    if (denominator === 0) {
      return 0;
    }

    return Math.round((numerator / denominator) * 10000) / 10000;
  }
}

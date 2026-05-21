/**
 * Purpose: Daily sweep that pays out referral bonuses to referrers once their
 *   invitee makes a first completed credit purchase.
 * Why important: Without this job the referral system stops at JOINED — the
 *   referrer never gets credited. Centralising the reward here keeps the
 *   payment flow ignorant of referrals.
 * Used by: JobsModule (scheduled via @nestjs/schedule).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  Prisma,
  ReferralStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import {
  ADVISORY_LOCK_KEYS,
  releaseAdvisoryLock,
  tryAdvisoryLock,
} from '../common/database/advisory-lock.util';
import { CreditService } from '../modules/credit/credit.service';

@Injectable()
export class ReferralRewardJob {
  private readonly logger = new Logger(ReferralRewardJob.name);
  private readonly batchSize = 100;
  private readonly rewardCredits: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly creditService: CreditService,
    configService: ConfigService,
  ) {
    this.rewardCredits = configService.get<number>('referral.rewardCredits') ?? 500;
  }

  @Cron('0 8 * * *')
  async handleReferralRewards() {
    const acquired = await tryAdvisoryLock(
      this.prismaService,
      ADVISORY_LOCK_KEYS.referralRewardJob,
    );

    if (!acquired) {
      this.logger.log(
        JSON.stringify({
          event: 'job.referral-reward.skipped',
          reason: 'another replica holds the advisory lock',
          at: new Date().toISOString(),
        }),
      );
      return null;
    }

    try {
      return await this.processReferralRewards();
    } finally {
      await releaseAdvisoryLock(
        this.prismaService,
        ADVISORY_LOCK_KEYS.referralRewardJob,
      ).catch((error) => {
        this.logger.warn(
          `Failed to release referral-reward advisory lock: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  }

  async processReferralRewards(now = new Date()) {
    const summary = {
      candidates: 0,
      rewarded: 0,
      skippedNoPurchase: 0,
      failed: 0,
    };

    const eligible = await this.prismaService.referral.findMany({
      where: {
        status: ReferralStatus.JOINED,
        refereeUserId: { not: null },
      },
      take: this.batchSize,
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        referrerId: true,
        refereeUserId: true,
      },
    });

    summary.candidates = eligible.length;

    for (const referral of eligible) {
      if (!referral.refereeUserId) {
        summary.failed += 1;
        continue;
      }

      const hasCompletedPurchase = await this.refereeHasCompletedPurchase(
        referral.refereeUserId,
      );

      if (!hasCompletedPurchase) {
        summary.skippedNoPurchase += 1;
        continue;
      }

      try {
        await this.rewardReferral(referral.id, referral.referrerId, now);
        summary.rewarded += 1;
      } catch (error) {
        summary.failed += 1;
        this.logger.error(
          JSON.stringify({
            event: 'job.referral-reward.failure',
            referralId: referral.id,
            error: error instanceof Error ? error.message : 'unknown',
          }),
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'job.referral-reward.summary',
        ...summary,
        at: now.toISOString(),
      }),
    );

    return summary;
  }

  private async refereeHasCompletedPurchase(refereeUserId: string): Promise<boolean> {
    const count = await this.prismaService.creditTransaction.count({
      where: {
        userId: refereeUserId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
      },
    });
    return count > 0;
  }

  /**
   * Atomic: claim the referral row first (only proceeds if it is still JOINED),
   * then grant bonus credits, then mark REWARDED. Wrapping all of this in a
   * single transaction guarantees we never double-reward.
   */
  private async rewardReferral(
    referralId: string,
    referrerId: string,
    now: Date,
  ) {
    await this.prismaService.$transaction(async (tx) => {
      const claimed = await tx.referral.updateMany({
        where: { id: referralId, status: ReferralStatus.JOINED },
        data: { status: ReferralStatus.REWARDED, rewardedAt: now },
      });
      if (claimed.count === 0) {
        return;
      }

      await this.creditService.grantBonusCredits(tx, {
        userId: referrerId,
        amount: this.rewardCredits,
        description: `Referral reward for invite ${referralId}`,
        metadata: {
          referralId,
          rewardedAt: now.toISOString(),
        } satisfies Prisma.InputJsonObject,
      });

      await tx.auditLog.create({
        data: {
          userId: referrerId,
          action: 'referral.rewarded',
          entityType: 'Referral',
          entityId: referralId,
          metadata: {
            rewardCredits: this.rewardCredits,
          } satisfies Prisma.InputJsonObject,
        },
      });
    });

    await this.creditService.invalidateBalanceCache(referrerId);
  }
}

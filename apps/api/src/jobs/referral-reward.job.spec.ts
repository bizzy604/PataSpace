/**
 * Purpose: Unit tests for ReferralRewardJob.
 * Why important: Locks in the invariants of the invite-friends reward loop —
 *   no purchase = no reward, claim is atomic, advisory lock prevents
 *   concurrent replicas from double-paying.
 * Used by: jest runner via apps/api jest config.
 */
import { ReferralStatus } from '@prisma/client';
import { ReferralRewardJob } from './referral-reward.job';

describe('ReferralRewardJob', () => {
  const createJob = () => {
    const prismaService: any = {
      referral: {
        findMany: jest.fn(),
      },
      creditTransaction: {
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => {
        const tx = {
          referral: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          auditLog: { create: jest.fn() },
        };
        await callback(tx);
        return tx;
      }),
    };
    const creditService = {
      grantBonusCredits: jest.fn().mockResolvedValue({
        balanceAfter: 5500,
        transaction: { id: 'txn_1' },
      }),
      invalidateBalanceCache: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(500),
    };

    return {
      prismaService,
      creditService,
      job: new ReferralRewardJob(
        prismaService as never,
        creditService as never,
        { runInternal: (fn: () => unknown) => fn() } as never,
        configService as never,
      ),
    };
  };

  it('rewards a JOINED referral only when the referee has a completed purchase', async () => {
    const { job, prismaService, creditService } = createJob();
    prismaService.referral.findMany.mockResolvedValue([
      { id: 'ref_1', referrerId: 'user_inviter', refereeUserId: 'user_invitee' },
    ]);
    prismaService.creditTransaction.count.mockResolvedValue(1);

    const summary = await job.processReferralRewards(
      new Date('2026-04-02T08:00:00.000Z'),
    );

    expect(summary.rewarded).toBe(1);
    expect(summary.skippedNoPurchase).toBe(0);
    expect(creditService.grantBonusCredits).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user_inviter',
        amount: 500,
      }),
    );
    expect(creditService.invalidateBalanceCache).toHaveBeenCalledWith('user_inviter');
  });

  it('skips referees who have not completed any purchase', async () => {
    const { job, prismaService, creditService } = createJob();
    prismaService.referral.findMany.mockResolvedValue([
      { id: 'ref_pending', referrerId: 'user_inviter', refereeUserId: 'user_invitee' },
    ]);
    prismaService.creditTransaction.count.mockResolvedValue(0);

    const summary = await job.processReferralRewards();

    expect(summary.rewarded).toBe(0);
    expect(summary.skippedNoPurchase).toBe(1);
    expect(creditService.grantBonusCredits).not.toHaveBeenCalled();
  });

  it('does not double-reward when the claim updateMany returns count=0', async () => {
    const { job, prismaService, creditService } = createJob();
    prismaService.referral.findMany.mockResolvedValue([
      { id: 'ref_raced', referrerId: 'user_inviter', refereeUserId: 'user_invitee' },
    ]);
    prismaService.creditTransaction.count.mockResolvedValue(1);
    // Simulate another replica winning the race
    prismaService.$transaction.mockImplementationOnce(async (callback: (tx: any) => unknown) => {
      const tx = {
        referral: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        auditLog: { create: jest.fn() },
      };
      await callback(tx);
      return tx;
    });

    await job.processReferralRewards();

    expect(creditService.grantBonusCredits).not.toHaveBeenCalled();
  });

  it('skips processing entirely when the advisory lock cannot be acquired', async () => {
    const { job, prismaService } = createJob();
    prismaService.$queryRaw.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

    const result = await job.handleReferralRewards();

    expect(result).toBeNull();
    expect(prismaService.referral.findMany).not.toHaveBeenCalled();
  });
});

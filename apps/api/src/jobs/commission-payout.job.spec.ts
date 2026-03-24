import { CommissionStatus, DisputeStatus } from '@prisma/client';
import { CommissionPayoutJob } from './commission-payout.job';

describe('CommissionPayoutJob', () => {
  const createJob = () => {
    let prismaService: any;
    prismaService = {
      commission: {
        updateMany: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      dispute: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(prismaService)),
    };
    const mpesaClient = {
      b2c: jest.fn(),
    };
    const smsService = {
      sendMessage: jest.fn(),
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001'),
    };

    return {
      prismaService,
      mpesaClient,
      smsService,
      userService,
      job: new CommissionPayoutJob(
        prismaService as never,
        mpesaClient as never,
        smsService as never,
        userService as never,
      ),
    };
  };

  it('promotes eligible commissions and pays due commissions', async () => {
    const { job, prismaService, mpesaClient, smsService } = createJob();
    const now = new Date('2026-04-02T06:00:00.000Z');

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaService.commission.findMany.mockResolvedValue([
      {
        id: 'commission_1',
        amountKES: 750,
        paymentAttempts: 0,
        unlock: {
          dispute: null,
          listing: {
            id: 'listing_1',
            neighborhood: 'Kilimani',
            user: {
              phoneNumberEncrypted: 'encrypted-phone',
            },
          },
        },
      },
    ]);
    mpesaClient.b2c.mockResolvedValue({
      conversationId: 'conv_1',
      originatorConversationId: 'orig_1',
      responseCode: '0',
      responseDescription: 'ok',
    });

    const summary = await job.processCommissionPayouts(now);

    expect(summary).toEqual({
      recoveredProcessing: 0,
      promotedToDue: 1,
      candidates: 1,
      paid: 1,
      retried: 0,
      deadLettered: 0,
      blockedByDispute: 0,
      skipped: 0,
    });
    expect(prismaService.commission.update).toHaveBeenCalledWith({
      where: {
        id: 'commission_1',
      },
      data: expect.objectContaining({
        status: CommissionStatus.PAID,
        mpesaTransactionId: 'conv_1',
        paidAt: now,
      }),
    });
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining("You've received 750 KES"),
    );
  });

  it('requeues transient payout failures and dead-letters terminal ones', async () => {
    const { job, prismaService, mpesaClient } = createJob();
    const now = new Date('2026-04-02T06:00:00.000Z');

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaService.commission.findMany.mockResolvedValue([
      {
        id: 'commission_retry',
        amountKES: 750,
        paymentAttempts: 1,
        unlock: {
          dispute: null,
          listing: {
            id: 'listing_retry',
            neighborhood: 'Kilimani',
            user: {
              phoneNumberEncrypted: 'encrypted-phone',
            },
          },
        },
      },
      {
        id: 'commission_dead',
        amountKES: 900,
        paymentAttempts: 2,
        unlock: {
          dispute: null,
          listing: {
            id: 'listing_dead',
            neighborhood: 'Westlands',
            user: {
              phoneNumberEncrypted: 'encrypted-phone',
            },
          },
        },
      },
    ]);
    mpesaClient.b2c
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('terminal failure'));

    const summary = await job.processCommissionPayouts(now);

    expect(summary.retried).toBe(1);
    expect(summary.deadLettered).toBe(1);
    expect(prismaService.commission.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          id: 'commission_retry',
        },
        data: expect.objectContaining({
          status: CommissionStatus.DUE,
          paymentAttempts: 2,
        }),
      }),
    );
    expect(prismaService.commission.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: 'commission_dead',
        },
        data: expect.objectContaining({
          status: CommissionStatus.FAILED,
          paymentAttempts: 3,
        }),
      }),
    );
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'commission.dead_lettered',
        entityId: 'commission_dead',
      }),
    });
  });

  it('skips commissions blocked by open disputes', async () => {
    const { job, prismaService } = createJob();

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    prismaService.commission.findMany.mockResolvedValue([
      {
        id: 'commission_blocked',
        amountKES: 750,
        paymentAttempts: 0,
        unlock: {
          dispute: {
            status: DisputeStatus.OPEN,
          },
          listing: {
            id: 'listing_1',
            neighborhood: 'Kilimani',
            user: {
              phoneNumberEncrypted: 'encrypted-phone',
            },
          },
        },
      },
    ]);

    const summary = await job.processCommissionPayouts(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.blockedByDispute).toBe(1);
    expect(prismaService.commission.update).not.toHaveBeenCalled();
  });

  it('returns a claimed commission to due when a blocking dispute appears after the payout claim', async () => {
    const { job, mpesaClient, prismaService } = createJob();

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prismaService.commission.findMany.mockResolvedValue([
      {
        id: 'commission_race',
        unlockId: 'unlock_1',
        amountKES: 750,
        paymentAttempts: 0,
        unlock: {
          dispute: null,
          listing: {
            id: 'listing_1',
            neighborhood: 'Kilimani',
            user: {
              phoneNumberEncrypted: 'encrypted-phone',
            },
          },
        },
      },
    ]);
    prismaService.dispute.findUnique.mockResolvedValue({
      status: DisputeStatus.INVESTIGATING,
    });

    const summary = await job.processCommissionPayouts(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.skipped).toBe(1);
    expect(prismaService.commission.update).toHaveBeenCalledWith({
      where: {
        id: 'commission_race',
      },
      data: {
        status: CommissionStatus.DUE,
        lastAttemptError: 'Blocked by dispute after payout claim',
      },
    });
    expect(mpesaClient.b2c).not.toHaveBeenCalled();
  });
});

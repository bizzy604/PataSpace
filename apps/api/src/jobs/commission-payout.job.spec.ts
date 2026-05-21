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
      $queryRaw: jest.fn(),
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(prismaService)),
    };
    const mpesaClient = {
      b2c: jest.fn(),
      queryB2CTransaction: jest.fn().mockResolvedValue({ outcome: 'pending' }),
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
        originatorConversationId: null,
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
    expect(prismaService.commission.update).toHaveBeenCalledWith({
      where: { id: 'commission_1' },
      data: expect.objectContaining({
        originatorConversationId: expect.stringMatching(/^pataspace-/),
      }),
    });
    expect(mpesaClient.b2c).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorConversationId: expect.stringMatching(/^pataspace-/),
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining("You've received 750 KES"),
    );
  });

  it('reuses an existing OriginatorConversationID on retry so Safaricom can dedupe', async () => {
    const { job, mpesaClient, prismaService } = createJob();
    const now = new Date('2026-04-02T06:00:00.000Z');

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prismaService.commission.findMany.mockResolvedValue([
      {
        id: 'commission_retry',
        unlockId: 'unlock_retry',
        amountKES: 750,
        paymentAttempts: 1,
        originatorConversationId: 'pataspace-existing-id',
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
    ]);
    mpesaClient.b2c.mockResolvedValue({
      conversationId: 'conv_retry',
      originatorConversationId: 'pataspace-existing-id',
      responseCode: '0',
      responseDescription: 'ok',
    });

    await job.processCommissionPayouts(now);

    expect(mpesaClient.b2c).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorConversationId: 'pataspace-existing-id',
      }),
    );
    const idAssignmentCall = prismaService.commission.update.mock.calls.find(
      ([arg]: [{ data?: Record<string, unknown> }]) =>
        typeof arg.data?.originatorConversationId === 'string' &&
        arg.data?.status === undefined,
    );
    expect(idAssignmentCall).toBeUndefined();
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
        originatorConversationId: 'pataspace-existing-retry',
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
        originatorConversationId: 'pataspace-existing-dead',
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
    expect(prismaService.commission.update).toHaveBeenCalledWith(
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
    expect(prismaService.commission.update).toHaveBeenCalledWith(
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

  it('recovers stale processing commissions before scanning due payouts', async () => {
    const { job, prismaService } = createJob();
    const now = new Date('2026-04-02T06:00:00.000Z');

    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 });
    prismaService.commission.findMany.mockResolvedValue([]);

    const summary = await job.processCommissionPayouts(now);

    expect(summary).toEqual({
      recoveredProcessing: 2,
      promotedToDue: 0,
      candidates: 0,
      paid: 0,
      retried: 0,
      deadLettered: 0,
      blockedByDispute: 0,
      skipped: 0,
    });
    expect(prismaService.commission.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          lastAttemptError: 'Recovered from stale processing state',
          status: CommissionStatus.DUE,
        }),
        where: expect.objectContaining({
          status: CommissionStatus.PROCESSING,
        }),
      }),
    );
  });

  describe('B2C query on retry', () => {
    it('short-circuits to PAID when Safaricom confirms a previous successful payout', async () => {
      const { job, prismaService, mpesaClient, smsService } = createJob();
      const now = new Date('2026-04-02T09:00:00.000Z');

      prismaService.commission.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });
      prismaService.commission.findMany.mockResolvedValue([
        {
          id: 'commission_recovered',
          unlockId: 'unlock_1',
          amountKES: 750,
          paymentAttempts: 1,
          originatorConversationId: 'pataspace-existing',
          unlock: {
            dispute: null,
            listing: {
              id: 'listing_1',
              neighborhood: 'Kilimani',
              user: { phoneNumberEncrypted: 'encrypted-phone' },
            },
          },
        },
      ]);
      mpesaClient.queryB2CTransaction.mockResolvedValue({
        outcome: 'success',
        conversationId: 'conv_from_query',
        mpesaReceiptNumber: 'RCK123ABC',
      });

      const summary = await job.processCommissionPayouts(now);

      expect(mpesaClient.b2c).not.toHaveBeenCalled();
      expect(summary.paid).toBe(1);
      expect(prismaService.commission.update).toHaveBeenCalledWith({
        where: { id: 'commission_recovered' },
        data: expect.objectContaining({
          status: CommissionStatus.PAID,
          mpesaTransactionId: 'conv_from_query',
          mpesaReceiptNumber: 'RCK123ABC',
          paidAt: now,
        }),
      });
      expect(smsService.sendMessage).toHaveBeenCalledWith(
        '+254700000001',
        expect.stringContaining("You've received 750 KES"),
      );
    });

    it('dead-letters immediately when the query confirms a terminal failure', async () => {
      const { job, prismaService, mpesaClient } = createJob();
      const now = new Date('2026-04-02T09:00:00.000Z');

      prismaService.commission.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });
      prismaService.commission.findMany.mockResolvedValue([
        {
          id: 'commission_failed_via_query',
          unlockId: 'unlock_1',
          amountKES: 750,
          paymentAttempts: 1,
          originatorConversationId: 'pataspace-existing',
          unlock: {
            dispute: null,
            listing: {
              id: 'listing_1',
              neighborhood: 'Kilimani',
              user: { phoneNumberEncrypted: 'encrypted-phone' },
            },
          },
        },
      ]);
      mpesaClient.queryB2CTransaction.mockResolvedValue({
        outcome: 'failed',
        resultDesc: 'Account closed',
      });

      const summary = await job.processCommissionPayouts(now);

      expect(mpesaClient.b2c).not.toHaveBeenCalled();
      expect(summary.deadLettered).toBe(1);
      expect(prismaService.commission.update).toHaveBeenCalledWith({
        where: { id: 'commission_failed_via_query' },
        data: expect.objectContaining({
          status: CommissionStatus.FAILED,
          lastAttemptError: 'Account closed',
        }),
      });
    });

    it('falls through to B2C re-issue when the query is pending', async () => {
      const { job, prismaService, mpesaClient } = createJob();
      const now = new Date('2026-04-02T09:00:00.000Z');

      prismaService.commission.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });
      prismaService.commission.findMany.mockResolvedValue([
        {
          id: 'commission_pending',
          unlockId: 'unlock_1',
          amountKES: 750,
          paymentAttempts: 1,
          originatorConversationId: 'pataspace-existing',
          unlock: {
            dispute: null,
            listing: {
              id: 'listing_1',
              neighborhood: 'Kilimani',
              user: { phoneNumberEncrypted: 'encrypted-phone' },
            },
          },
        },
      ]);
      mpesaClient.queryB2CTransaction.mockResolvedValue({ outcome: 'pending' });
      mpesaClient.b2c.mockResolvedValue({
        conversationId: 'conv_reissued',
        originatorConversationId: 'pataspace-existing',
        responseCode: '0',
        responseDescription: 'ok',
      });

      const summary = await job.processCommissionPayouts(now);

      expect(mpesaClient.b2c).toHaveBeenCalledWith(
        expect.objectContaining({ originatorConversationId: 'pataspace-existing' }),
      );
      expect(summary.paid).toBe(1);
    });
  });

  describe('handleCommissionPayouts (advisory-lock gated entry point)', () => {
    it('skips processing when the advisory lock is held by another replica', async () => {
      const { job, prismaService } = createJob();
      prismaService.$queryRaw.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

      const result = await job.handleCommissionPayouts();

      expect(result).toBeNull();
      expect(prismaService.commission.findMany).not.toHaveBeenCalled();
      expect(prismaService.commission.updateMany).not.toHaveBeenCalled();
    });

    it('acquires the lock, processes the batch, and releases the lock on completion', async () => {
      const { job, prismaService } = createJob();
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);
      prismaService.commission.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 0 });
      prismaService.commission.findMany.mockResolvedValue([]);

      const result = await job.handleCommissionPayouts();

      expect(result).not.toBeNull();
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('releases the lock even if the inner run throws', async () => {
      const { job, prismaService } = createJob();
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);
      prismaService.commission.updateMany.mockRejectedValue(new Error('db down'));

      await expect(job.handleCommissionPayouts()).rejects.toThrow('db down');
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });
});

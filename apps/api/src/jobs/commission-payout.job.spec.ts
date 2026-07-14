/**
 * Purpose: Gate tests for the payout pipeline (job + processor + recorder):
 * acceptance-is-not-settlement, query-confirmed payment, duplicate-safe
 * retries, dead-lettering, stale recovery, and overdue settlement flags.
 * Why important: these pin the invariant that PAID is only ever written on
 * a settlement signal, and that a crash after acceptance can never produce
 * a second payout or a false FAILED.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { CommissionStatus, DisputeStatus } from '@prisma/client';
import { MpesaDuplicateSubmissionError } from '../infrastructure/payment/mpesa.types';
import { CommissionPayoutJob } from './commission-payout.job';
import { CommissionPayoutProcessor } from './commission-payout.processor';
import {
  CommissionPayoutRecorder,
  DUPLICATE_SUBMISSION_NOTE,
  SETTLEMENT_OVERDUE_NOTE,
} from './commission-payout.recorder';
import { CommissionSettlementConfirmer } from './commission-settlement.confirmer';

describe('CommissionPayoutJob pipeline', () => {
  const createHarness = () => {
    let prismaService: any;
    prismaService = {
      commission: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
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
    const recorder = new CommissionPayoutRecorder(prismaService as never);
    const confirmer = new CommissionSettlementConfirmer(
      mpesaClient as never,
      smsService as never,
      recorder,
    );
    const processor = new CommissionPayoutProcessor(
      prismaService as never,
      mpesaClient as never,
      userService as never,
      recorder,
      confirmer,
    );

    return {
      prismaService,
      mpesaClient,
      smsService,
      userService,
      job: new CommissionPayoutJob(
        prismaService as never,
        processor,
        recorder,
        { runInternal: (fn: () => unknown) => fn() } as never,
      ),
    };
  };

  const candidate = (overrides: Record<string, unknown> = {}) => ({
    id: 'commission_1',
    unlockId: 'unlock_1',
    amountKES: 750,
    paymentAttempts: 0,
    originatorConversationId: null,
    unlock: {
      dispute: null,
      listing: {
        id: 'listing_1',
        neighborhood: 'Kilimani',
        user: { phoneNumberEncrypted: 'encrypted-phone' },
      },
    },
    ...overrides,
  });

  /** Queue: overdue scan result, then due candidates. */
  const primeFindMany = (prismaService: any, dueRows: unknown[], overdueRows: unknown[] = []) => {
    prismaService.commission.findMany
      .mockResolvedValueOnce(overdueRows)
      .mockResolvedValueOnce(dueRows);
  };

  const now = new Date('2026-04-02T06:00:00.000Z');

  it('leaves an accepted payout PROCESSING and awaiting settlement — acceptance is not PAID', async () => {
    const { job, prismaService, mpesaClient, smsService } = createHarness();
    primeFindMany(prismaService, [candidate()]);
    mpesaClient.b2c.mockResolvedValue({
      conversationId: 'conv_1',
      originatorConversationId: 'orig_1',
      responseCode: '0',
      responseDescription: 'Accept the service request successfully.',
    });

    const summary = await job.processCommissionPayouts(now);

    expect(summary.submitted).toBe(1);
    expect(summary.paid).toBe(0);
    // The acceptance is recorded on the PROCESSING row…
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'commission_1', status: CommissionStatus.PROCESSING },
        data: expect.objectContaining({
          mpesaTransactionId: 'conv_1',
          paymentAttempts: 1,
        }),
      }),
    );
    // …and no write anywhere flips the row to PAID.
    const paidWrites = prismaService.commission.updateMany.mock.calls.filter(
      ([arg]: [{ data?: { status?: string } }]) => arg.data?.status === CommissionStatus.PAID,
    );
    expect(paidWrites).toHaveLength(0);
    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });

  it('pays with the receipt when the settlement is positively confirmed (sandbox path)', async () => {
    const { job, prismaService, mpesaClient, smsService } = createHarness();
    primeFindMany(prismaService, [candidate()]);
    mpesaClient.b2c.mockResolvedValue({
      conversationId: 'conv_1',
      originatorConversationId: 'orig_1',
      responseCode: '0',
      responseDescription: 'ok',
    });
    mpesaClient.queryB2CTransaction.mockResolvedValue({
      outcome: 'success',
      conversationId: 'conv_confirmed',
      mpesaReceiptNumber: 'RCK123ABC',
    });

    const summary = await job.processCommissionPayouts(now);

    expect(summary.paid).toBe(1);
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'commission_1',
          status: { in: [CommissionStatus.PROCESSING, CommissionStatus.DUE] },
        },
        data: expect.objectContaining({
          status: CommissionStatus.PAID,
          paidAt: now,
          mpesaTransactionId: 'conv_confirmed',
          mpesaReceiptNumber: 'RCK123ABC',
        }),
      }),
    );
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'commission.paid' }),
    });
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining("You've received 750 KES"),
    );
  });

  it('confirms a prior submission on retry instead of re-issuing', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [
      candidate({ paymentAttempts: 1, originatorConversationId: 'pataspace-existing' }),
    ]);
    mpesaClient.queryB2CTransaction.mockResolvedValue({
      outcome: 'success',
      conversationId: 'conv_from_query',
      mpesaReceiptNumber: 'RCK999',
    });

    const summary = await job.processCommissionPayouts(now);

    expect(mpesaClient.b2c).not.toHaveBeenCalled();
    expect(summary.paid).toBe(1);
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CommissionStatus.PAID,
          mpesaReceiptNumber: 'RCK999',
        }),
      }),
    );
  });

  it('dead-letters when the query confirms a terminal failure', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [
      candidate({ paymentAttempts: 1, originatorConversationId: 'pataspace-existing' }),
    ]);
    mpesaClient.queryB2CTransaction.mockResolvedValue({
      outcome: 'failed',
      resultDesc: 'Account closed',
    });

    const summary = await job.processCommissionPayouts(now);

    expect(mpesaClient.b2c).not.toHaveBeenCalled();
    expect(summary.deadLettered).toBe(1);
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CommissionStatus.FAILED,
          lastAttemptError: 'Account closed',
        }),
      }),
    );
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'commission.dead_lettered' }),
    });
  });

  it('re-issues with the same OriginatorConversationID when the query has no decision', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [
      candidate({ paymentAttempts: 1, originatorConversationId: 'pataspace-existing' }),
    ]);
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
    expect(summary.submitted).toBe(1);
    // No fresh id was minted for the retry.
    const idAssignment = prismaService.commission.update.mock.calls.find(
      ([arg]: [{ data?: Record<string, unknown> }]) =>
        typeof arg.data?.originatorConversationId === 'string',
    );
    expect(idAssignment).toBeUndefined();
  });

  it('waits (never re-issues or fails) when Safaricom rejects a duplicate submission', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [
      candidate({ paymentAttempts: 2, originatorConversationId: 'pataspace-existing' }),
    ]);
    mpesaClient.b2c.mockRejectedValue(new MpesaDuplicateSubmissionError());

    const summary = await job.processCommissionPayouts(now);

    expect(summary.submitted).toBe(1);
    expect(summary.deadLettered).toBe(0);
    expect(summary.retried).toBe(0);
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'commission_1', status: CommissionStatus.PROCESSING },
        data: expect.objectContaining({
          lastAttemptError: DUPLICATE_SUBMISSION_NOTE,
        }),
      }),
    );
  });

  it('requeues transient failures and dead-letters terminal ones', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [
      candidate({ id: 'commission_retry', paymentAttempts: 1, originatorConversationId: 'pataspace-a' }),
      candidate({ id: 'commission_dead', paymentAttempts: 2, originatorConversationId: 'pataspace-b' }),
    ]);
    mpesaClient.b2c
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('terminal failure'));

    const summary = await job.processCommissionPayouts(now);

    expect(summary.retried).toBe(1);
    expect(summary.deadLettered).toBe(1);
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'commission_retry', status: CommissionStatus.PROCESSING },
        data: expect.objectContaining({
          status: CommissionStatus.DUE,
          paymentAttempts: 2,
        }),
      }),
    );
    expect(prismaService.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'commission_dead' }),
        data: expect.objectContaining({
          status: CommissionStatus.FAILED,
          paymentAttempts: 3,
        }),
      }),
    );
  });

  it('treats a settlement recorded first by the callback as the winner (no SMS, no double write)', async () => {
    const { job, prismaService, mpesaClient, smsService } = createHarness();
    primeFindMany(prismaService, [
      candidate({ paymentAttempts: 1, originatorConversationId: 'pataspace-existing' }),
    ]);
    mpesaClient.queryB2CTransaction.mockResolvedValue({
      outcome: 'success',
      conversationId: 'conv_from_query',
    });
    // Batch calls (recover, promote) succeed; the PAID claim loses the race.
    prismaService.commission.updateMany.mockImplementation(
      async (args: { data?: { status?: string } }) =>
        args.data?.status === CommissionStatus.PAID ? { count: 0 } : { count: 1 },
    );

    const summary = await job.processCommissionPayouts(now);

    expect(summary.paid).toBe(0);
    expect(summary.skipped).toBe(1);
    expect(smsService.sendMessage).not.toHaveBeenCalled();
    expect(prismaService.auditLog.create).not.toHaveBeenCalled();
  });

  it('skips commissions blocked by open disputes', async () => {
    const { job, prismaService } = createHarness();
    primeFindMany(prismaService, [
      candidate({ unlock: { dispute: { status: DisputeStatus.OPEN }, listing: { id: 'l', neighborhood: 'K', user: { phoneNumberEncrypted: 'enc' } } } }),
    ]);

    const summary = await job.processCommissionPayouts(now);

    expect(summary.blockedByDispute).toBe(1);
  });

  it('returns a claimed commission to due when a blocking dispute appears after the claim', async () => {
    const { job, prismaService, mpesaClient } = createHarness();
    primeFindMany(prismaService, [candidate()]);
    prismaService.dispute.findUnique.mockResolvedValue({ status: DisputeStatus.INVESTIGATING });

    const summary = await job.processCommissionPayouts(now);

    expect(summary.skipped).toBe(1);
    expect(prismaService.commission.update).toHaveBeenCalledWith({
      where: { id: 'commission_1' },
      data: {
        status: CommissionStatus.DUE,
        lastAttemptError: 'Blocked by dispute after payout claim',
      },
    });
    expect(mpesaClient.b2c).not.toHaveBeenCalled();
  });

  it('recovers only stale claims that never reached Safaricom', async () => {
    const { job, prismaService } = createHarness();
    prismaService.commission.updateMany
      .mockResolvedValueOnce({ count: 2 }) // recover (unsent only)
      .mockResolvedValueOnce({ count: 0 }); // promote
    primeFindMany(prismaService, []);

    const summary = await job.processCommissionPayouts(now);

    expect(summary.recoveredProcessing).toBe(2);
    expect(prismaService.commission.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: CommissionStatus.PROCESSING,
          // Submitted rows are excluded: their money may have moved.
          mpesaTransactionId: null,
        }),
        data: expect.objectContaining({ status: CommissionStatus.DUE }),
      }),
    );
  });

  it('flags submitted payouts whose settlement result is overdue, without touching status', async () => {
    const { job, prismaService } = createHarness();
    primeFindMany(
      prismaService,
      [],
      [
        {
          id: 'commission_overdue',
          amountKES: 900,
          mpesaTransactionId: 'conv_lost',
          originatorConversationId: 'pataspace-lost',
          lastAttemptAt: new Date('2026-03-30T09:00:00.000Z'),
        },
      ],
    );

    const summary = await job.processCommissionPayouts(now);

    expect(summary.settlementOverdue).toBe(1);
    expect(prismaService.commission.update).toHaveBeenCalledWith({
      where: { id: 'commission_overdue' },
      data: { lastAttemptError: SETTLEMENT_OVERDUE_NOTE },
    });
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'commission.settlement_overdue',
        entityId: 'commission_overdue',
      }),
    });
    const statusWrites = prismaService.commission.update.mock.calls.filter(
      ([arg]: [{ data?: { status?: string } }]) => arg.data?.status !== undefined,
    );
    expect(statusWrites).toHaveLength(0);
  });

  describe('handleCommissionPayouts (advisory-lock gated entry point)', () => {
    it('skips processing when the advisory lock is held by another replica', async () => {
      const { job, prismaService } = createHarness();
      prismaService.$queryRaw.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

      const result = await job.handleCommissionPayouts();

      expect(result).toBeNull();
      expect(prismaService.commission.findMany).not.toHaveBeenCalled();
    });

    it('acquires the lock, processes the batch, and releases the lock on completion', async () => {
      const { job, prismaService } = createHarness();
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);
      primeFindMany(prismaService, []);

      const result = await job.handleCommissionPayouts();

      expect(result).not.toBeNull();
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('releases the lock even if the inner run throws', async () => {
      const { job, prismaService } = createHarness();
      prismaService.$queryRaw
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([{ pg_advisory_unlock: true }]);
      prismaService.commission.updateMany.mockRejectedValue(new Error('db down'));

      await expect(job.handleCommissionPayouts()).rejects.toThrow('db down');
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });
});

/**
 * Purpose: Gate tests for the success-fee engine: fee snapshot, credit
 * capture, 70/30 commission math, credit settlement, and mover gating.
 * Why important: this is the revenue engine; a math error here misprices
 * liabilities and poster payouts (spec section 4.3 worked examples).
 * Used by: jest unit lane (pnpm test:unit).
 */
import { HttpException } from '@nestjs/common';
import { SuccessFeeService } from './success-fee.service';

describe('SuccessFeeService', () => {
  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      successFee: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn(),
      invalidateBalanceCache: jest.fn(),
      spendCredits: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    return {
      creditService,
      prismaService,
      service: new SuccessFeeService(
        prismaService as never,
        creditService as never,
        configService as never,
      ),
    };
  };

  const eligibleUnlock = (overrides = {}) => ({
    id: 'unlock_1',
    buyerId: 'buyer_1',
    creditsSpent: 300,
    listing: {
      id: 'listing_1',
      userId: 'owner_1',
      monthlyRent: 25000,
      successFeeKes: 2500,
    },
    confirmations: [
      { confirmedAt: new Date('2026-03-20T10:00:00.000Z') },
      { confirmedAt: new Date('2026-03-24T09:00:00.000Z') },
    ],
    ...overrides,
  });

  const transactionClientWith = (feeRow: Record<string, unknown>) => ({
    successFee: {
      upsert: jest.fn().mockResolvedValue(feeRow),
      update: jest.fn(),
    },
    commission: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  });

  it('captures the mover credits toward the fee and pays the poster 70% of collected', async () => {
    const { prismaService, service } = createService();
    const feeRow = {
      id: 'fee_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 0,
      status: 'PARTIAL',
    };
    const transactionClient = transactionClientWith(feeRow);

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    const summary = await service.ensureForConfirmedUnlock(eligibleUnlock() as never);

    expect(transactionClient.successFee.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { unlockId: 'unlock_1' },
        create: expect.objectContaining({
          feeDueKes: 2500,
          creditsApplied: 300,
          moverId: 'buyer_1',
          status: 'PARTIAL',
        }),
      }),
    );
    // 70% of the 300 collected so far.
    expect(transactionClient.commission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          amountKES: 210,
          outgoingTenantId: 'owner_1',
        }),
        update: expect.objectContaining({
          amountKES: 210,
        }),
      }),
    );
    expect(summary).toMatchObject({
      feeDueKes: 2500,
      creditsApplied: 300,
      remainingKes: 2200,
      status: 'PARTIAL',
    });
  });

  it('settles immediately when unlock credits cover the whole fee', async () => {
    const { prismaService, service } = createService();
    const feeRow = {
      id: 'fee_1',
      feeDueKes: 1000,
      creditsApplied: 1000,
      cashCollectedKes: 0,
      status: 'SETTLED',
    };
    const transactionClient = transactionClientWith(feeRow);

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    const summary = await service.ensureForConfirmedUnlock(
      eligibleUnlock({
        creditsSpent: 1200,
        listing: {
          id: 'listing_1',
          userId: 'owner_1',
          monthlyRent: 8000,
          successFeeKes: 1000,
        },
      }) as never,
    );

    expect(transactionClient.successFee.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          creditsApplied: 1000,
          status: 'SETTLED',
        }),
      }),
    );
    expect(transactionClient.commission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          amountKES: 700,
        }),
      }),
    );
    expect(summary.remainingKes).toBe(0);
  });

  it('settles the remaining balance from wallet credits and syncs the commission', async () => {
    const { creditService, prismaService, service } = createService();
    const settledFee = {
      id: 'fee_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 2200,
      status: 'SETTLED',
    };
    const transactionClient = {
      successFee: {
        update: jest.fn().mockResolvedValue(settledFee),
      },
      commission: {
        updateMany: jest.fn(),
      },
    };

    prismaService.successFee.findUnique.mockResolvedValue({
      id: 'fee_1',
      unlockId: 'unlock_1',
      moverId: 'buyer_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 0,
      status: 'PARTIAL',
    });
    creditService.getCurrentBalanceValue.mockResolvedValue(3000);
    creditService.spendCredits.mockResolvedValue({ balanceAfter: 800 });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    const result = await service.settleFromCredits('buyer_1', 'unlock_1');

    expect(creditService.spendCredits).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        amount: 2200,
        userId: 'buyer_1',
      }),
    );
    // Commission becomes 70% of the fully collected 2,500 = 1,750.
    expect(transactionClient.commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          amountKES: 1750,
        },
      }),
    );
    expect(result.fee.status).toBe('SETTLED');
    expect(result.newBalance).toBe(800);
    expect(creditService.invalidateBalanceCache).toHaveBeenCalledWith('buyer_1');
  });

  it('rejects settlement without enough credits, naming the shortfall', async () => {
    const { creditService, prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue({
      id: 'fee_1',
      unlockId: 'unlock_1',
      moverId: 'buyer_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 0,
      status: 'PARTIAL',
    });
    creditService.getCurrentBalanceValue.mockResolvedValue(1000);

    await expect(service.settleFromCredits('buyer_1', 'unlock_1')).rejects.toMatchObject({
      status: 402,
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('rejects settlement attempts from anyone but the mover', async () => {
    const { prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue({
      id: 'fee_1',
      unlockId: 'unlock_1',
      moverId: 'buyer_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 0,
      status: 'PARTIAL',
    });

    await expect(service.settleFromCredits('intruder_1', 'unlock_1')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('reports settled fees idempotently', async () => {
    const { creditService, prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue({
      id: 'fee_1',
      unlockId: 'unlock_1',
      moverId: 'buyer_1',
      feeDueKes: 2500,
      creditsApplied: 300,
      cashCollectedKes: 2200,
      status: 'SETTLED',
    });
    creditService.getCurrentBalanceValue.mockResolvedValue(800);

    const result = await service.settleFromCredits('buyer_1', 'unlock_1');

    expect(result.alreadySettled).toBe(true);
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('flags movers with unsettled fees for unlock gating', async () => {
    const { prismaService, service } = createService();

    prismaService.successFee.findFirst.mockResolvedValue({ id: 'fee_1' });
    await expect(service.hasUnsettledFee('buyer_1')).resolves.toBe(true);

    prismaService.successFee.findFirst.mockResolvedValue(null);
    await expect(service.hasUnsettledFee('buyer_1')).resolves.toBe(false);
  });
});

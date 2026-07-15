/**
 * Purpose: Gate tests for wallet settlement of success fees: the atomic
 * claim, double-charge prevention under concurrency, shortfall rejection,
 * mover authorization, and idempotent replays.
 * Why important: a lost claim that still spends charges the mover twice;
 * these tests pin the guard shape and every lost-claim outcome.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { HttpException } from '@nestjs/common';
import { DEFAULT_PRICING_CONFIG } from '../listing/domain/pricing.policy';
import { SuccessFeeSettlementService } from './success-fee-settlement.service';

describe('SuccessFeeSettlementService', () => {
  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      successFee: {
        findUnique: jest.fn(),
      },
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn(),
      invalidateBalanceCache: jest.fn(),
      spendCredits: jest.fn(),
    };
    const systemConfig = {
      resolvePricingConfig: jest.fn().mockResolvedValue(DEFAULT_PRICING_CONFIG),
    };

    return {
      creditService,
      prismaService,
      service: new SuccessFeeSettlementService(
        prismaService as never,
        creditService as never,
        systemConfig as never,
      ),
    };
  };

  const partialFee = (overrides = {}) => ({
    id: 'fee_1',
    unlockId: 'unlock_1',
    moverId: 'buyer_1',
    feeDueKes: 2500,
    creditsApplied: 300,
    cashCollectedKes: 0,
    status: 'PARTIAL',
    ...overrides,
  });

  const transactionClientWith = (claimCount: number, settledFee?: Record<string, unknown>) => ({
    successFee: {
      updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(settledFee),
    },
    commission: {
      updateMany: jest.fn(),
    },
  });

  it('settles the remaining balance from wallet credits and syncs the commission', async () => {
    const { creditService, prismaService, service } = createService();
    const settledFee = partialFee({ cashCollectedKes: 2200, status: 'SETTLED' });
    const transactionClient = transactionClientWith(1, settledFee);

    prismaService.successFee.findUnique.mockResolvedValue(partialFee());
    creditService.getCurrentBalanceValue.mockResolvedValue(3000);
    creditService.spendCredits.mockResolvedValue({ balanceAfter: 800 });
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    const result = await service.settleFromCredits('buyer_1', 'unlock_1');

    // The claim must guard on the exact figures the remaining amount was
    // computed from; anything looser reopens the double-charge race.
    expect(transactionClient.successFee.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'fee_1',
          status: { not: 'SETTLED' },
          creditsApplied: 300,
          cashCollectedKes: 0,
        },
      }),
    );
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

  it('does not spend when a concurrent request already settled the fee', async () => {
    const { creditService, prismaService, service } = createService();
    const transactionClient = transactionClientWith(0);

    prismaService.successFee.findUnique
      .mockResolvedValueOnce(partialFee())
      // Re-read after the lost claim: the concurrent winner settled it.
      .mockResolvedValueOnce(partialFee({ cashCollectedKes: 2200, status: 'SETTLED' }));
    creditService.getCurrentBalanceValue.mockResolvedValue(3000);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    const result = await service.settleFromCredits('buyer_1', 'unlock_1');

    expect(result.alreadySettled).toBe(true);
    expect(creditService.spendCredits).not.toHaveBeenCalled();
    expect(transactionClient.commission.updateMany).not.toHaveBeenCalled();
  });

  it('reports 404 when the fee disappears after a lost claim (refunded unlock)', async () => {
    const { creditService, prismaService, service } = createService();
    const transactionClient = transactionClientWith(0);

    prismaService.successFee.findUnique
      .mockResolvedValueOnce(partialFee())
      .mockResolvedValueOnce(null);
    creditService.getCurrentBalanceValue.mockResolvedValue(3000);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(service.settleFromCredits('buyer_1', 'unlock_1')).rejects.toMatchObject({
      status: 404,
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('conflicts when the claim is lost but the fee is still due', async () => {
    const { creditService, prismaService, service } = createService();
    const transactionClient = transactionClientWith(0);

    prismaService.successFee.findUnique
      .mockResolvedValueOnce(partialFee())
      .mockResolvedValueOnce(partialFee({ cashCollectedKes: 1000 }));
    creditService.getCurrentBalanceValue.mockResolvedValue(3000);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(service.settleFromCredits('buyer_1', 'unlock_1')).rejects.toMatchObject({
      status: 409,
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('rejects settlement without enough credits, naming the shortfall', async () => {
    const { creditService, prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue(partialFee());
    creditService.getCurrentBalanceValue.mockResolvedValue(1000);

    await expect(service.settleFromCredits('buyer_1', 'unlock_1')).rejects.toMatchObject({
      status: 402,
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('rejects settlement attempts from anyone but the mover', async () => {
    const { prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue(partialFee());

    await expect(service.settleFromCredits('intruder_1', 'unlock_1')).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it('reports settled fees idempotently', async () => {
    const { creditService, prismaService, service } = createService();

    prismaService.successFee.findUnique.mockResolvedValue(
      partialFee({ cashCollectedKes: 2200, status: 'SETTLED' }),
    );
    creditService.getCurrentBalanceValue.mockResolvedValue(800);

    const result = await service.settleFromCredits('buyer_1', 'unlock_1');

    expect(result.alreadySettled).toBe(true);
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });
});

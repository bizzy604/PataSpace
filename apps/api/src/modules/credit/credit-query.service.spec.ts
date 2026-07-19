/**
 * Purpose: Gate tests for the credit read models: cached balance summary and
 * paginated transaction history mapping.
 * Why important: the wallet screens render exactly what these return; the
 * cache path must never mutate and must share the movement engine's key.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { TransactionStatus, TransactionType } from '@prisma/client';
import {
  TransactionStatus as ContractTransactionStatus,
  TransactionType as ContractTransactionType,
} from '@pataspace/contracts';
import { CreditQueryService } from './credit-query.service';

describe('CreditQueryService', () => {
  const createService = () => {
    const prismaService = {
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
      commission: {
        aggregate: jest.fn(),
      },
      creditTransaction: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const creditService = {
      ensureCreditAccount: jest.fn(),
    };

    return {
      cacheService,
      creditService,
      prismaService,
      service: new CreditQueryService(
        prismaService as never,
        cacheService as never,
        creditService as never,
      ),
    };
  };

  it('returns cached balances without querying Prisma', async () => {
    const { cacheService, creditService, prismaService, service } = createService();

    cacheService.get.mockResolvedValue({
      balance: 1200,
      lifetimeEarned: 1500,
      lifetimeSpent: 300,
      pendingCommissions: 900,
    });

    await expect(service.getBalance('user_1')).resolves.toMatchObject({
      balance: 1200,
      pendingCommissions: 900,
    });
    expect(creditService.ensureCreditAccount).not.toHaveBeenCalled();
    expect(prismaService.commission.aggregate).not.toHaveBeenCalled();
  });

  it('hydrates missing balances from Prisma and caches the result', async () => {
    const { cacheService, creditService, prismaService, service } = createService();

    cacheService.get.mockResolvedValue(null);
    creditService.ensureCreditAccount.mockResolvedValue({
      balance: 5000,
      lifetimeEarned: 6500,
      lifetimeSpent: 1500,
    });
    prismaService.commission.aggregate.mockResolvedValue({
      _sum: {
        amountKES: 750,
      },
    });

    await expect(service.getBalance('user_1')).resolves.toEqual({
      balance: 5000,
      lifetimeEarned: 6500,
      lifetimeSpent: 1500,
      pendingCommissions: 750,
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      'credit:balance:user_1',
      expect.objectContaining({
        balance: 5000,
        pendingCommissions: 750,
      }),
      300,
    );
  });

  it('maps paginated transaction history from Prisma results', async () => {
    const { prismaService, service } = createService();

    prismaService.creditTransaction.count.mockResolvedValue(2);
    prismaService.creditTransaction.findMany.mockResolvedValue([
      {
        id: 'txn_2',
        type: TransactionType.SPEND,
        amount: -2500,
        balanceBefore: 5000,
        balanceAfter: 2500,
        status: TransactionStatus.COMPLETED,
        description: 'Unlocked listing in Kilimani',
        mpesaReceiptNumber: null,
        unlockId: 'unlock_1',
        createdAt: new Date('2026-03-24T09:00:00.000Z'),
      },
      {
        id: 'txn_1',
        type: TransactionType.PURCHASE,
        amount: 5000,
        balanceBefore: 0,
        balanceAfter: 5000,
        status: TransactionStatus.COMPLETED,
        description: 'Credit purchase - 5 credits package',
        mpesaReceiptNumber: 'PSPACE123',
        unlockId: null,
        createdAt: new Date('2026-03-24T08:00:00.000Z'),
      },
    ]);

    const result = await service.getTransactionHistory('user_1', {
      limit: 2,
      page: 1,
      status: ContractTransactionStatus.COMPLETED,
      type: ContractTransactionType.PURCHASE,
    });

    expect(prismaService.creditTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 2,
        where: {
          userId: 'user_1',
          type: 'PURCHASE',
          status: 'COMPLETED',
        },
      }),
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(result.data[0]).toMatchObject({
      id: 'txn_2',
      unlockId: 'unlock_1',
    });
    expect(result.data[1]).toMatchObject({
      id: 'txn_1',
      mpesaReceiptNumber: 'PSPACE123',
    });
  });
});

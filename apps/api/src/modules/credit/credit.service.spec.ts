import { HttpException } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import {
  TransactionStatus as ContractTransactionStatus,
  TransactionType as ContractTransactionType,
} from '@pataspace/contracts';
import { CreditService } from './credit.service';

describe('CreditService', () => {
  const createCreditService = () => {
    const prismaService = {
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
      commission: {
        aggregate: jest.fn(),
      },
      credit: {
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      creditTransaction: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };
    const cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    return {
      prismaService,
      cacheService,
      service: new CreditService(prismaService as never, cacheService as never),
    };
  };

  it('returns cached balances without querying Prisma', async () => {
    const { cacheService, prismaService, service } = createCreditService();

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
    expect(prismaService.credit.upsert).not.toHaveBeenCalled();
    expect(prismaService.commission.aggregate).not.toHaveBeenCalled();
  });

  it('hydrates missing balances from Prisma and caches the result', async () => {
    const { cacheService, prismaService, service } = createCreditService();

    cacheService.get.mockResolvedValue(null);
    prismaService.credit.upsert.mockResolvedValue({
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

  it('throws a payment-required error when credits are insufficient', async () => {
    const { prismaService, service } = createCreditService();

    prismaService.credit.upsert.mockResolvedValue({
      balance: 400,
    });
    prismaService.credit.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.applyBalanceDecrement(prismaService as never, {
        userId: 'user_1',
        amount: 2500,
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('maps paginated transaction history from Prisma results', async () => {
    const { prismaService, service } = createCreditService();

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

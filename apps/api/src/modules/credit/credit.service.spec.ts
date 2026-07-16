/**
 * Purpose: Gate tests for the credit movement engine: the guarded decrement
 * and movement-row creation including the purchase idempotency key.
 * Why important: the conditional decrement is the overdraft guard; the
 * idempotency key on the row is what the purchase dedupe constraint rides on.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { HttpException } from '@nestjs/common';
import { PaymentMethod, TransactionStatus, TransactionType } from '@prisma/client';
import { CreditService } from './credit.service';

describe('CreditService', () => {
  const createCreditService = () => {
    const prismaService = {
      credit: {
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      creditTransaction: {
        create: jest.fn(),
      },
    };
    const cacheService = {
      del: jest.fn(),
    };

    return {
      prismaService,
      cacheService,
      service: new CreditService(prismaService as never, cacheService as never),
    };
  };

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

  it('persists the idempotency key and payment method on purchase rows', async () => {
    const { prismaService, service } = createCreditService();
    prismaService.creditTransaction.create.mockResolvedValue({ id: 'txn_1' });

    await service.createTransaction(prismaService as never, {
      userId: 'user_1',
      type: TransactionType.PURCHASE,
      amount: 5000,
      balanceBefore: 0,
      balanceAfter: 0,
      status: TransactionStatus.PENDING,
      paymentMethod: PaymentMethod.MPESA,
      idempotencyKey: 'purchase-key-123',
    });

    expect(prismaService.creditTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: 'purchase-key-123',
        paymentMethod: PaymentMethod.MPESA,
        status: TransactionStatus.PENDING,
      }),
    });
  });

  it('invalidates the shared balance cache key', async () => {
    const { cacheService, service } = createCreditService();

    await service.invalidateBalanceCache('user_1');

    expect(cacheService.del).toHaveBeenCalledWith('credit:balance:user_1');
  });
});

/**
 * Purpose: Gate tests for the refund engine: instant credit refunds, the
 * atomic refund claim, spend reversal, commission cancellation,
 * proxy-session expiry, and dead reasons.
 * Why important: automatic refunds are the brand promise; a broken refund
 * path is a trust incident, and a lost claim race mints credits.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ConflictException } from '@nestjs/common';
import {
  CommissionStatus,
  TransactionStatus,
  UnlockDeadReason,
} from '@prisma/client';
import { UnlockRefundService } from './unlock-refund.service';

describe('UnlockRefundService', () => {
  const createRefundService = () => {
    const prismaService = {
      unlock: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const creditService = {
      invalidateBalanceCache: jest.fn(),
      refundCredits: jest.fn(),
    };
    const proxySessionService = {
      expireForUnlock: jest.fn(),
    };
    const notifier = {
      afterRefund: jest.fn(),
    };

    return {
      creditService,
      notifier,
      prismaService,
      proxySessionService,
      service: new UnlockRefundService(
        prismaService as never,
        creditService as never,
        proxySessionService as never,
        notifier as never,
      ),
    };
  };

  const createRefundableUnlock = (overrides = {}) => ({
    id: 'unlock_1',
    buyerId: 'buyer_1',
    listingId: 'listing_1',
    creditsSpent: 300,
    isRefunded: false,
    creditTransaction: {
      id: 'txn_spend_1',
      metadata: {
        listingId: 'listing_1',
      },
    },
    commission: {
      id: 'commission_1',
      status: CommissionStatus.PENDING,
    },
    buyer: {
      phoneNumberEncrypted: 'enc_buyer_phone',
    },
    ...overrides,
  });

  const createTransactionClient = (unlock: unknown, claimCount = 1) => ({
    commission: {
      update: jest.fn(),
    },
    creditTransaction: {
      update: jest.fn(),
    },
    unlock: {
      findUnique: jest.fn().mockResolvedValue(unlock),
      updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
    },
    successFee: {
      deleteMany: jest.fn(),
    },
  });

  it('claims the unlock atomically, refunds, cancels commission, and notifies', async () => {
    const {
      creditService,
      notifier,
      prismaService,
      proxySessionService,
      service,
    } = createRefundService();
    const transactionClient = createTransactionClient(createRefundableUnlock());

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    creditService.refundCredits.mockResolvedValue({
      transaction: {
        id: 'txn_refund_1',
      },
    });

    await service.refundUnlockById('unlock_1', 'Listing invalidated');

    expect(transactionClient.unlock.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'unlock_1',
        isRefunded: false,
      },
      data: expect.objectContaining({
        isRefunded: true,
        refundReason: 'Listing invalidated',
        deadReason: null,
      }),
    });
    expect(creditService.refundCredits).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        amount: 300,
        userId: 'buyer_1',
      }),
    );
    expect(proxySessionService.expireForUnlock).toHaveBeenCalledWith(
      transactionClient,
      'unlock_1',
    );
    expect(transactionClient.successFee.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unlockId: 'unlock_1',
        }),
      }),
    );
    expect(transactionClient.creditTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TransactionStatus.REFUNDED,
        }),
      }),
    );
    expect(transactionClient.commission.update).toHaveBeenCalledWith({
      where: {
        id: 'commission_1',
      },
      data: expect.objectContaining({
        status: CommissionStatus.CANCELLED,
      }),
    });
    expect(creditService.invalidateBalanceCache).toHaveBeenCalledWith('buyer_1');
    expect(notifier.afterRefund).toHaveBeenCalledWith({
      listingId: 'listing_1',
      buyerPhoneEncrypted: 'enc_buyer_phone',
      reason: 'Listing invalidated',
    });
  });

  it('does not credit when another trigger already claimed the refund', async () => {
    const { creditService, notifier, prismaService, service } = createRefundService();
    // The unlock read as refundable, but the concurrent winner committed
    // first, so the claim matches zero rows.
    const transactionClient = createTransactionClient(createRefundableUnlock(), 0);

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await service.refundUnlockById('unlock_1', 'Listing invalidated');

    expect(creditService.refundCredits).not.toHaveBeenCalled();
    expect(transactionClient.creditTransaction.update).not.toHaveBeenCalled();
    expect(transactionClient.commission.update).not.toHaveBeenCalled();
    expect(transactionClient.successFee.deleteMany).not.toHaveBeenCalled();
    expect(creditService.invalidateBalanceCache).not.toHaveBeenCalled();
    expect(notifier.afterRefund).not.toHaveBeenCalled();
  });

  it('records the dead reason on reason-coded refunds', async () => {
    const { creditService, prismaService, service } = createRefundService();
    const transactionClient = createTransactionClient(createRefundableUnlock());

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    creditService.refundCredits.mockResolvedValue({
      transaction: {
        id: 'txn_refund_1',
      },
    });

    await service.refundUnlock('unlock_1', 'Landlord declined the move-in', {
      deadReason: UnlockDeadReason.LANDLORD_DECLINED,
    });

    expect(transactionClient.unlock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deadReason: UnlockDeadReason.LANDLORD_DECLINED,
        }),
      }),
    );
    expect(creditService.refundCredits).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        metadata: expect.objectContaining({
          deadReason: UnlockDeadReason.LANDLORD_DECLINED,
        }),
      }),
    );
  });

  it('rejects unlock refunds once the commission has already been paid', async () => {
    const { creditService, prismaService, service } = createRefundService();
    const transactionClient = createTransactionClient(
      createRefundableUnlock({
        creditTransaction: null,
        commission: {
          id: 'commission_1',
          status: CommissionStatus.PAID,
        },
      }),
    );

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(
      service.refundUnlockById('unlock_1', 'Listing invalidated'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(creditService.refundCredits).not.toHaveBeenCalled();
    expect(transactionClient.unlock.updateMany).not.toHaveBeenCalled();
  });

  it('skips unlocks that are already refunded', async () => {
    const { creditService, notifier, prismaService, service } = createRefundService();
    const transactionClient = createTransactionClient(
      createRefundableUnlock({ isRefunded: true }),
    );

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await service.refundUnlockById('unlock_1', 'Listing invalidated');

    expect(transactionClient.unlock.updateMany).not.toHaveBeenCalled();
    expect(creditService.refundCredits).not.toHaveBeenCalled();
    expect(notifier.afterRefund).not.toHaveBeenCalled();
  });
});

/**
 * Purpose: Gate tests for the refund engine: instant credit refunds, spend
 * reversal, commission cancellation, proxy-session expiry, and dead reasons.
 * Why important: automatic refunds are the brand promise; a broken refund
 * path is a trust incident.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ConflictException } from '@nestjs/common';
import {
  CommissionStatus,
  TransactionStatus,
  UnlockDeadReason,
} from '@prisma/client';
import { encryptField } from '../../common/security/encryption.util';
import { UnlockRefundService } from './unlock-refund.service';

describe('UnlockRefundService', () => {
  const encryptionKey = '12345678901234567890123456789012';

  const createRefundService = () => {
    const prismaService = {
      unlock: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn(),
      invalidateBalanceCache: jest.fn(),
      refundCredits: jest.fn(),
    };
    const listingCacheService = {
      invalidateListing: jest.fn(),
    };
    const proxySessionService = {
      expireForUnlock: jest.fn(),
    };
    const smsService = {
      sendMessage: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockImplementation((key: string) =>
        key === 'security.encryptionKey' ? encryptionKey : undefined,
      ),
    };

    return {
      creditService,
      listingCacheService,
      prismaService,
      proxySessionService,
      smsService,
      service: new UnlockRefundService(
        prismaService as never,
        creditService as never,
        listingCacheService as never,
        proxySessionService as never,
        smsService as never,
        configService as never,
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
      status: TransactionStatus.COMPLETED,
    },
    commission: {
      id: 'commission_1',
      status: CommissionStatus.PENDING,
    },
    buyer: {
      phoneNumberEncrypted: encryptField('+254712345678', encryptionKey),
    },
    ...overrides,
  });

  it('refunds an unlock, marks the spend as refunded, cancels commission, and expires the proxy session', async () => {
    const {
      creditService,
      listingCacheService,
      prismaService,
      proxySessionService,
      service,
      smsService,
    } = createRefundService();
    const transactionClient = {
      commission: {
        update: jest.fn(),
      },
      creditTransaction: {
        update: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn().mockResolvedValue(createRefundableUnlock()),
        update: jest.fn(),
      },
      proxySession: {
        updateMany: jest.fn(),
      },
      successFee: {
        deleteMany: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    creditService.refundCredits.mockResolvedValue({
      transaction: {
        id: 'txn_refund_1',
      },
    });

    await service.refundUnlockById('unlock_1', 'Listing invalidated');

    expect(creditService.refundCredits).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        amount: 300,
        userId: 'buyer_1',
      }),
    );
    expect(transactionClient.unlock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isRefunded: true,
          refundReason: 'Listing invalidated',
          deadReason: null,
        }),
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
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254712345678',
      'Your unlock has been refunded on PataSpace. Reason: Listing invalidated',
    );
  });

  it('records the dead reason on reason-coded refunds', async () => {
    const { creditService, prismaService, service } = createRefundService();
    const transactionClient = {
      commission: {
        update: jest.fn(),
      },
      creditTransaction: {
        update: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn().mockResolvedValue(createRefundableUnlock()),
        update: jest.fn(),
      },
      proxySession: {
        updateMany: jest.fn(),
      },
      successFee: {
        deleteMany: jest.fn(),
      },
    };

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

    expect(transactionClient.unlock.update).toHaveBeenCalledWith(
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
    const transactionClient = {
      unlock: {
        findUnique: jest.fn().mockResolvedValue(
          createRefundableUnlock({
            creditTransaction: null,
            commission: {
              id: 'commission_1',
              status: CommissionStatus.PAID,
            },
          }),
        ),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(
      service.refundUnlockById('unlock_1', 'Listing invalidated'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(creditService.refundCredits).not.toHaveBeenCalled();
  });
});

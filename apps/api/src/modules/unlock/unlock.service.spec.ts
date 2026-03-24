import {
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissionStatus,
  ConfirmationSide,
  DisputeStatus,
  Prisma,
  TransactionStatus,
} from '@prisma/client';
import { encryptField } from '../../common/security/encryption.util';
import { UnlockService } from './unlock.service';

describe('UnlockService', () => {
  const encryptionKey = '12345678901234567890123456789012';

  const createUnlockService = () => {
    const prismaService = {
      unlock: {
        findUnique: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      listing: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn(),
      invalidateBalanceCache: jest.fn(),
      refundCredits: jest.fn(),
      spendCredits: jest.fn(),
    };
    const listingCacheService = {
      invalidateListing: jest.fn(),
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
      smsService,
      service: new UnlockService(
        prismaService as never,
        creditService as never,
        listingCacheService as never,
        smsService as never,
        configService as never,
      ),
    };
  };

  const createStoredUnlock = (overrides = {}) => ({
    id: 'unlock_1',
    listingId: 'listing_1',
    buyerId: 'buyer_1',
    creditsSpent: 2500,
    revealedAddressEncrypted: encryptField('Ngong Road', encryptionKey),
    revealedPhoneEncrypted: encryptField('+254712345678', encryptionKey),
    revealedGPS: '-1.2,36.8',
    isRefunded: false,
    refundReason: null,
    refundedAt: null,
    createdAt: new Date('2026-03-24T10:00:00.000Z'),
    confirmations: [],
    creditTransaction: null,
    listing: {
      id: 'listing_1',
      userId: 'owner_1',
      neighborhood: 'Kilimani',
      monthlyRent: 25000,
      bedrooms: 1,
      addressEncrypted: encryptField('Ngong Road', encryptionKey),
      latitude: -1.2,
      longitude: 36.8,
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: encryptField('+254700000002', encryptionKey),
      },
    },
    ...overrides,
  });

  it('rejects attempts to unlock the user’s own listing', async () => {
    const { prismaService, service } = createUnlockService();

    prismaService.unlock.findUnique.mockResolvedValue(null);
    prismaService.listing.findFirst.mockResolvedValue({
      id: 'listing_1',
      userId: 'user_1',
      addressEncrypted: 'address',
      latitude: -1.2,
      longitude: 36.8,
      neighborhood: 'Kilimani',
      unlockCostCredits: 2500,
      isApproved: true,
      isDeleted: false,
      status: 'ACTIVE',
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: 'phone',
      },
    });

    await expect(
      service.createUnlock('user_1', {
        listingId: 'listing_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing listings', async () => {
    const { prismaService, service } = createUnlockService();

    prismaService.unlock.findUnique.mockResolvedValue(null);
    prismaService.listing.findFirst.mockResolvedValue(null);

    await expect(
      service.createUnlock('user_2', {
        listingId: 'missing_listing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects listings that are no longer unlockable', async () => {
    const { prismaService, service } = createUnlockService();

    prismaService.unlock.findUnique.mockResolvedValue(null);
    prismaService.listing.findFirst.mockResolvedValue({
      id: 'listing_1',
      userId: 'owner_1',
      addressEncrypted: 'address',
      latitude: -1.2,
      longitude: 36.8,
      neighborhood: 'Kilimani',
      unlockCostCredits: 2500,
      isApproved: false,
      isDeleted: false,
      status: 'PENDING',
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: 'phone',
      },
    });

    await expect(
      service.createUnlock('buyer_1', {
        listingId: 'listing_1',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('rechecks listing availability inside the transaction before spending credits', async () => {
    const { creditService, prismaService, service } = createUnlockService();
    const listing = {
      id: 'listing_1',
      userId: 'owner_1',
      addressEncrypted: 'address',
      latitude: -1.2,
      longitude: 36.8,
      neighborhood: 'Kilimani',
      unlockCostCredits: 2500,
      isApproved: true,
      isDeleted: false,
      status: 'ACTIVE',
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: 'phone',
      },
    };
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };

    prismaService.unlock.findUnique.mockResolvedValue(null);
    prismaService.listing.findFirst.mockResolvedValue(listing);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(
      service.createUnlock('buyer_1', {
        listingId: 'listing_1',
      }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(transactionClient.unlock.create).not.toHaveBeenCalled();
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('returns an existing unlock without charging credits again', async () => {
    const { creditService, prismaService, service } = createUnlockService();

    prismaService.unlock.findUnique.mockResolvedValue(createStoredUnlock());
    creditService.getCurrentBalanceValue.mockResolvedValue(6000);

    const result = await service.createUnlock('buyer_1', {
      listingId: 'listing_1',
    });

    expect(result.created).toBe(false);
    expect(result.payload).toMatchObject({
      unlockId: 'unlock_1',
      newBalance: 6000,
    });
    expect(creditService.spendCredits).not.toHaveBeenCalled();
  });

  it('rejects repeat access when the existing unlock was refunded', async () => {
    const { prismaService, service } = createUnlockService();

    prismaService.unlock.findUnique.mockResolvedValue(
      createStoredUnlock({
        isRefunded: true,
        refundReason: 'Listing removed',
        refundedAt: new Date('2026-03-24T12:00:00.000Z'),
      }),
    );

    await expect(
      service.createUnlock('buyer_1', {
        listingId: 'listing_1',
      }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('returns disputed unlocks with the disputed history status', async () => {
    const { prismaService, service } = createUnlockService();

    prismaService.unlock.count.mockResolvedValue(1);
    prismaService.unlock.findMany.mockResolvedValue([
      {
        id: 'unlock_1',
        listingId: 'listing_1',
        creditsSpent: 2500,
        revealedAddressEncrypted: encryptField('Ngong Road', encryptionKey),
        revealedPhoneEncrypted: encryptField('+254712345678', encryptionKey),
        revealedGPS: '-1.2,36.8',
        isRefunded: false,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
        confirmations: [
          {
            side: ConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-24T11:00:00.000Z'),
          },
        ],
        dispute: {
          status: DisputeStatus.OPEN,
        },
        listing: {
          id: 'listing_1',
          neighborhood: 'Kilimani',
          monthlyRent: 25000,
          bedrooms: 1,
        },
      },
    ]);
    prismaService.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    );

    const result = await service.getMyUnlocks('buyer_1', {
      status: 'disputed',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      status: 'disputed',
      unlockId: 'unlock_1',
    });
  });

  it('propagates insufficient-credit failures from the unlock service boundary', async () => {
    const { creditService, prismaService, service } = createUnlockService();
    const listing = {
      id: 'listing_1',
      userId: 'owner_1',
      addressEncrypted: 'address',
      latitude: -1.2,
      longitude: 36.8,
      neighborhood: 'Kilimani',
      unlockCostCredits: 2500,
      isApproved: true,
      isDeleted: false,
      status: 'ACTIVE',
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: 'phone',
      },
    };
    const unlock = createStoredUnlock({
      creditTransaction: {
        id: 'txn_spend_1',
        metadata: {},
        status: TransactionStatus.COMPLETED,
      },
      listing: {
        ...createStoredUnlock().listing,
        addressEncrypted: 'address',
        latitude: -1.2,
        longitude: 36.8,
        neighborhood: 'Kilimani',
      },
      revealedAddressEncrypted: 'address',
      revealedGPS: '-1.2,36.8',
      revealedPhoneEncrypted: 'phone',
    });
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: {
        findFirst: jest.fn().mockResolvedValue(listing),
        update: jest.fn(),
      },
      unlock: {
        create: jest.fn().mockResolvedValue(unlock),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    prismaService.unlock.findUnique.mockResolvedValue(null);
    prismaService.listing.findFirst.mockResolvedValue(listing);
    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    creditService.spendCredits.mockRejectedValue(
      new HttpException(
        {
          code: 'INSUFFICIENT_CREDITS',
          message: 'Top up credits first',
        },
        402,
      ),
    );

    await expect(
      service.createUnlock('buyer_1', {
        listingId: 'listing_1',
      }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(creditService.invalidateBalanceCache).not.toHaveBeenCalled();
  });

  it('recovers concurrent duplicate unlocks when the unique constraint is hit', async () => {
    const { creditService, prismaService, service } = createUnlockService();
    const listing = {
      id: 'listing_1',
      userId: 'owner_1',
      addressEncrypted: 'address',
      latitude: -1.2,
      longitude: 36.8,
      neighborhood: 'Kilimani',
      unlockCostCredits: 2500,
      isApproved: true,
      isDeleted: false,
      status: 'ACTIVE',
      user: {
        firstName: 'Owner',
        lastName: 'Tester',
        phoneNumberEncrypted: 'phone',
      },
    };

    prismaService.unlock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createStoredUnlock());
    prismaService.listing.findFirst.mockResolvedValue(listing);
    prismaService.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate unlock', {
        clientVersion: '5.22.0',
        code: 'P2002',
      }),
    );
    creditService.getCurrentBalanceValue.mockResolvedValue(6000);

    const result = await service.createUnlock('buyer_1', {
      listingId: 'listing_1',
    });

    expect(result.created).toBe(false);
    expect(result.payload).toMatchObject({
      newBalance: 6000,
      unlockId: 'unlock_1',
    });
  });

  it('refunds an unlock, marks the spend as refunded, and cancels pending commission', async () => {
    const { creditService, listingCacheService, prismaService, service, smsService } =
      createUnlockService();
    const transactionClient = {
      commission: {
        update: jest.fn(),
      },
      creditTransaction: {
        update: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'unlock_1',
          buyerId: 'buyer_1',
          listingId: 'listing_1',
          creditsSpent: 2500,
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
        }),
        update: jest.fn(),
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
        amount: 2500,
        userId: 'buyer_1',
      }),
    );
    expect(transactionClient.unlock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isRefunded: true,
          refundReason: 'Listing invalidated',
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

  it('rejects unlock refunds once the commission has already been paid', async () => {
    const { creditService, prismaService, service } = createUnlockService();
    const transactionClient = {
      unlock: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'unlock_1',
          buyerId: 'buyer_1',
          listingId: 'listing_1',
          creditsSpent: 2500,
          isRefunded: false,
          creditTransaction: null,
          commission: {
            id: 'commission_1',
            status: CommissionStatus.PAID,
          },
          buyer: {
            phoneNumberEncrypted: encryptField('+254712345678', encryptionKey),
          },
        }),
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

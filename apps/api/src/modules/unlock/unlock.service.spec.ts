import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { ConfirmationSide, DisputeStatus } from '@prisma/client';
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
      prismaService,
      service: new UnlockService(
        prismaService as never,
        creditService as never,
        listingCacheService as never,
        smsService as never,
        configService as never,
      ),
    };
  };

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
});

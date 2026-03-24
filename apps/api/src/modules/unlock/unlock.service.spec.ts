import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { UnlockService } from './unlock.service';

describe('UnlockService', () => {
  const createUnlockService = () => {
    const prismaService = {
      unlock: {
        findUnique: jest.fn(),
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
        key === 'security.encryptionKey' ? '12345678901234567890123456789012' : undefined,
      ),
    };

    return {
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
});

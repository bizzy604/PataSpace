import { ConflictException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  const encryptionKey = '12345678901234567890123456789012';

  const createListingService = () => {
    const prismaService = {
      $transaction: jest.fn(),
    };
    const userService = {};
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
      prismaService,
      listingCacheService,
      service: new ListingService(
        prismaService as never,
        userService as never,
        listingCacheService as never,
        smsService as never,
        configService as never,
      ),
    };
  };

  it('allows owners to delete listings once unlock activity is fully resolved', async () => {
    const { listingCacheService, prismaService, service } = createListingService();
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'listing_1',
          userId: 'owner_1',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      unlock: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(service.softDeleteListing('owner_1', 'listing_1')).resolves.toBeUndefined();
    expect(transactionClient.unlock.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isRefunded: false,
          listingId: 'listing_1',
        }),
      }),
    );
    expect(transactionClient.listing.update).toHaveBeenCalledWith({
      where: {
        id: 'listing_1',
      },
      data: expect.objectContaining({
        isDeleted: true,
        status: ListingStatus.DELETED,
      }),
    });
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
  });

  it('blocks deletion while unresolved unlock activity still exists', async () => {
    const { listingCacheService, prismaService, service } = createListingService();
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'listing_1',
          userId: 'owner_1',
        }),
        update: jest.fn(),
      },
      unlock: {
        count: jest.fn().mockResolvedValue(1),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(service.softDeleteListing('owner_1', 'listing_1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(transactionClient.listing.update).not.toHaveBeenCalled();
    expect(listingCacheService.invalidateListing).not.toHaveBeenCalled();
  });
});

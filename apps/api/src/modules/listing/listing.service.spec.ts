import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ListingStatus, UploadMediaType } from '@prisma/client';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  const encryptionKey = '12345678901234567890123456789012';

  const createListingService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      auditLog: {
        create: jest.fn(),
      },
      listing: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      unlock: {
        findMany: jest.fn(),
      },
      uploadedAsset: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001'),
      findStoredById: jest.fn(),
    };
    const listingCacheService = {
      getBrowse: jest.fn(),
      getDetails: jest.fn(),
      invalidateListing: jest.fn(),
      setBrowse: jest.fn(),
      setDetails: jest.fn(),
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
      listingCacheService,
      prismaService,
      service: new ListingService(
        prismaService as never,
        userService as never,
        listingCacheService as never,
        smsService as never,
        configService as never,
      ),
      smsService,
      userService,
    };
  };

  const createStoredUser = (overrides = {}) => ({
    banReason: null,
    id: 'owner_1',
    isActive: true,
    isBanned: false,
    phoneVerified: true,
    ...overrides,
  });

  const createUploadedAsset = (overrides = {}) => ({
    cdnUrl: 'https://cdn.example.com/listings/owner_1/photo-1.jpg',
    confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    mediaType: UploadMediaType.IMAGE,
    storageKey: 'listings/owner_1/photo-1.jpg',
    url: 'https://uploads.example.com/listings/owner_1/photo-1.jpg',
    userId: 'owner_1',
    ...overrides,
  });

  const createListingInput = (overrides = {}) => ({
    address: 'Kilimani House, Nairobi',
    amenities: ['Water 24/7', 'Parking'],
    availableFrom: '2026-05-01T00:00:00.000Z',
    availableTo: '2026-05-31T00:00:00.000Z',
    bathrooms: 1,
    bedrooms: 2,
    county: 'Nairobi',
    description: 'Listing with enough detail to satisfy validation rules.',
    furnished: false,
    houseType: 'TWO_BEDROOM',
    latitude: -1.289563,
    longitude: 36.790942,
    monthlyRent: 25000,
    neighborhood: 'Kilimani',
    photos: [
      {
        height: 900,
        latitude: -1.289563,
        longitude: 36.790942,
        order: 1,
        s3Key: 'listings/owner_1/photo-1.jpg',
        takenAt: '2026-03-24T09:00:00.000Z',
        url: 'https://uploads.example.com/listings/owner_1/photo-1.jpg',
        width: 1200,
      },
      {
        height: 900,
        latitude: -1.289563,
        longitude: 36.790942,
        order: 2,
        s3Key: 'listings/owner_1/photo-2.jpg',
        takenAt: '2026-03-24T09:05:00.000Z',
        url: 'https://uploads.example.com/listings/owner_1/photo-2.jpg',
        width: 1200,
      },
    ],
    propertyNotes: 'Near bus stop',
    propertyType: 'Apartment',
    video: {
      s3Key: 'listings/owner_1/walkthrough.mp4',
      url: 'https://uploads.example.com/listings/owner_1/walkthrough.mp4',
    },
    ...overrides,
  });

  const createExistingListing = (overrides = {}) => ({
    commission: 750,
    houseType: 'TWO_BEDROOM',
    id: 'listing_1',
    isApproved: true,
    isDeleted: false,
    latitude: -1.289563,
    longitude: 36.790942,
    monthlyRent: 25000,
    photos: [],
    rejectionReason: null,
    status: ListingStatus.ACTIVE,
    unlockCostCredits: 2500,
    unlockCount: 0,
    updatedAt: new Date('2026-03-24T08:00:00.000Z'),
    userId: 'owner_1',
    ...overrides,
  });

  it('requires a mobile device for listing creation', async () => {
    const { service } = createListingService();

    await expect(
      service.createListing('owner_1', 'web', createListingInput() as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires admin review for a user's first three listings", async () => {
    const { listingCacheService, prismaService, service, userService } = createListingService();
    const input = createListingInput();

    userService.findStoredById.mockResolvedValue(createStoredUser());
    prismaService.uploadedAsset.findMany.mockResolvedValue([
      createUploadedAsset(),
      createUploadedAsset({
        cdnUrl: 'https://cdn.example.com/listings/owner_1/photo-2.jpg',
        storageKey: 'listings/owner_1/photo-2.jpg',
        url: 'https://uploads.example.com/listings/owner_1/photo-2.jpg',
      }),
    ]);
    prismaService.uploadedAsset.findUnique.mockResolvedValue(
      createUploadedAsset({
        cdnUrl: 'https://cdn.example.com/listings/owner_1/walkthrough.mp4',
        mediaType: UploadMediaType.VIDEO,
        storageKey: 'listings/owner_1/walkthrough.mp4',
        url: 'https://uploads.example.com/listings/owner_1/walkthrough.mp4',
      }),
    );
    prismaService.listing.count.mockResolvedValue(2);
    prismaService.listing.create.mockResolvedValue({
      commission: 750,
      id: 'listing_1',
      status: ListingStatus.PENDING,
      unlockCostCredits: 2500,
    });

    const result = await service.createListing('owner_1', 'mobile', input as never);

    expect(result).toMatchObject({
      estimatedApprovalTime: '24 hours',
      id: 'listing_1',
      message: 'Listing created. Awaiting admin review (first 3 listings).',
      status: 'PENDING',
    });
    expect(prismaService.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvedAt: null,
          isApproved: false,
          status: ListingStatus.PENDING,
        }),
      }),
    );
    expect(listingCacheService.invalidateListing).not.toHaveBeenCalled();
  });

  it('rejects listing creation when photo GPS does not match the listing coordinates', async () => {
    const { prismaService, service, userService } = createListingService();

    userService.findStoredById.mockResolvedValue(createStoredUser());

    await expect(
      service.createListing(
        'owner_1',
        'mobile',
        createListingInput({
          photos: [
            {
              height: 900,
              latitude: -1.2,
              longitude: 36.9,
              order: 1,
              s3Key: 'listings/owner_1/photo-1.jpg',
              takenAt: '2026-03-24T09:00:00.000Z',
              url: 'https://uploads.example.com/listings/owner_1/photo-1.jpg',
              width: 1200,
            },
          ],
        }) as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.uploadedAsset.findMany).not.toHaveBeenCalled();
  });

  it('blocks listing updates from non-owners', async () => {
    const { prismaService, service } = createListingService();

    prismaService.listing.findFirst.mockResolvedValue(
      createExistingListing({
        userId: 'other_owner',
      }),
    );

    await expect(
      service.updateListing('owner_1', 'listing_1', {
        description: 'Updated description',
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('locks critical listing fields after the listing has been unlocked', async () => {
    const { prismaService, service } = createListingService();

    prismaService.listing.findFirst.mockResolvedValue(
      createExistingListing({
        unlockCount: 1,
      }),
    );

    await expect(
      service.updateListing('owner_1', 'listing_1', {
        monthlyRent: 30000,
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaService.listing.update).not.toHaveBeenCalled();
  });

  it('resubmits rejected listings for review when they are edited', async () => {
    const { listingCacheService, prismaService, service } = createListingService();

    prismaService.listing.findFirst.mockResolvedValue(
      createExistingListing({
        isApproved: false,
        rejectionReason: 'Photos were unclear',
        status: ListingStatus.REJECTED,
      }),
    );
    prismaService.listing.update.mockResolvedValue({
      id: 'listing_1',
      updatedAt: new Date('2026-03-25T09:30:00.000Z'),
    });

    const result = await service.updateListing('owner_1', 'listing_1', {
      description: '  Updated description with clearer details.  ',
    } as never);

    expect(prismaService.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Updated description with clearer details.',
          isApproved: false,
          rejectionReason: null,
          status: ListingStatus.PENDING,
        }),
      }),
    );
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
    expect(result).toEqual({
      id: 'listing_1',
      message: 'Listing updated successfully',
      updatedAt: '2026-03-25T09:30:00.000Z',
    });
  });

  it('applies browse filters and caches the browse response', async () => {
    const { listingCacheService, prismaService, service } = createListingService();
    const listing = {
      availableFrom: new Date('2026-05-01T00:00:00.000Z'),
      bathrooms: 1,
      bedrooms: 2,
      county: 'Nairobi',
      createdAt: new Date('2026-03-25T09:30:00.000Z'),
      furnished: false,
      houseType: 'TWO_BEDROOM',
      id: 'listing_1',
      latitude: -1.289563,
      longitude: 36.790942,
      monthlyRent: 25000,
      neighborhood: 'Kilimani',
      propertyType: 'Apartment',
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      unlockCostCredits: 2500,
      unlockCount: 1,
      user: {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        firstName: 'Alice',
      },
      viewCount: 10,
    };

    listingCacheService.getBrowse.mockResolvedValue(null);
    prismaService.listing.count.mockReturnValue('count-query' as never);
    prismaService.listing.findMany.mockReturnValue('find-query' as never);
    prismaService.$transaction.mockResolvedValue([[listing].length, [listing]]);
    prismaService.unlock.findMany.mockResolvedValue([{ listingId: 'listing_1' }]);

    const result = await service.browseListings(
      {
        county: 'Nairobi',
        furnished: false,
        limit: 10,
        neighborhoods: ['Kilimani'],
        page: 1,
      } as never,
      {
        id: 'buyer_1',
        role: 'USER' as never,
      },
    );

    expect(prismaService.listing.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        county: 'Nairobi',
        furnished: false,
        neighborhood: {
          in: ['Kilimani'],
        },
      }),
    });
    expect(prismaService.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          county: 'Nairobi',
          furnished: false,
          neighborhood: {
            in: ['Kilimani'],
          },
        }),
      }),
    );
    expect(result.data[0]).toMatchObject({
      id: 'listing_1',
      isUnlocked: true,
      mapLocation: {
        approxLatitude: -1.29,
        approxLongitude: 36.79,
      },
      neighborhood: 'Kilimani',
    });
    expect(listingCacheService.setBrowse).toHaveBeenCalledWith(
      'buyer_1',
      expect.objectContaining({
        county: 'Nairobi',
      }),
      result,
    );
  });

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

  it('blocks deletion attempts from non-owners', async () => {
    const { listingCacheService, prismaService, service } = createListingService();
    const transactionClient = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'listing_1' }]),
      listing: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'listing_1',
          userId: 'other_owner',
        }),
        update: jest.fn(),
      },
      unlock: {
        count: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );

    await expect(
      service.softDeleteListing('owner_1', 'listing_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(transactionClient.unlock.count).not.toHaveBeenCalled();
    expect(transactionClient.listing.update).not.toHaveBeenCalled();
    expect(listingCacheService.invalidateListing).not.toHaveBeenCalled();
  });

  it('blocks approving listings unless they are still pending', async () => {
    const { prismaService, service } = createListingService();

    prismaService.listing.findFirst.mockResolvedValue({
      ...createExistingListing({
        status: ListingStatus.ACTIVE,
      }),
      photos: [],
      user: {
        phoneNumberEncrypted: 'encrypted-phone',
      },
    });

    await expect(
      service.approveListing('admin_1', 'listing_1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks rejecting listings unless they are still pending', async () => {
    const { prismaService, service } = createListingService();

    prismaService.listing.findFirst.mockResolvedValue({
      ...createExistingListing({
        status: ListingStatus.ACTIVE,
      }),
      user: {
        phoneNumberEncrypted: 'encrypted-phone',
      },
    });

    await expect(
      service.rejectListing('admin_1', 'listing_1', {
        reason: 'Missing evidence',
      } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

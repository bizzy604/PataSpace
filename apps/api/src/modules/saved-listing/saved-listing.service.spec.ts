/**
 * Purpose: Unit tests for SavedListingService.
 * Why important: Locks in the access guards (not-found listing, duplicate
 *   save, removing an unsaved item) and the unlock-flag enrichment.
 * Used by: jest runner via apps/api jest config.
 */
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SavedListingService } from './saved-listing.service';

describe('SavedListingService', () => {
  const create = () => {
    const prismaService: any = {
      $transaction: jest.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
      savedListing: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      listing: {
        findFirst: jest.fn(),
      },
      unlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    return { prismaService, service: new SavedListingService(prismaService as never) };
  };

  const buildListing = () => ({
    id: 'listing_1',
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    bedrooms: 2,
    bathrooms: 1,
    houseType: 'TWO_BEDROOM',
    propertyType: 'Apartment',
    furnished: false,
    availableFrom: new Date('2026-04-01T00:00:00.000Z'),
    unlockCostCredits: 2500,
    thumbnailUrl: null,
    viewCount: 45,
    unlockCount: 3,
    createdAt: new Date('2026-03-20T10:00:00.000Z'),
    latitude: -1.295,
    longitude: 36.789,
    user: {
      firstName: 'Amina',
      createdAt: new Date('2025-12-09T00:00:00.000Z'),
    },
  });

  it('saves a listing and returns the enriched record', async () => {
    const { prismaService, service } = create();
    prismaService.listing.findFirst.mockResolvedValue({ id: 'listing_1' });
    prismaService.savedListing.create.mockResolvedValue({
      id: 'saved_1',
      createdAt: new Date('2026-04-02T09:00:00.000Z'),
      listing: buildListing(),
    });

    const result = await service.saveListing('user_1', 'listing_1');

    expect(result.id).toBe('saved_1');
    expect(result.listing.id).toBe('listing_1');
    expect(result.listing.isUnlocked).toBe(false);
    expect(result.listing.mapLocation.approxLatitude).toBe(-1.29);
    expect(result.listing.mapLocation.approxLongitude).toBe(36.79);
  });

  it('refuses to save a non-existent listing', async () => {
    const { prismaService, service } = create();
    prismaService.listing.findFirst.mockResolvedValue(null);

    await expect(
      service.saveListing('user_1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate saves to a 409 conflict', async () => {
    const { prismaService, service } = create();
    prismaService.listing.findFirst.mockResolvedValue({ id: 'listing_1' });
    prismaService.savedListing.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );

    await expect(
      service.saveListing('user_1', 'listing_1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns NOT_FOUND when removing a listing that was never saved', async () => {
    const { prismaService, service } = create();
    prismaService.savedListing.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.unsaveListing('user_1', 'listing_1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists saved listings with the unlock flag derived from the buyer history', async () => {
    const { prismaService, service } = create();
    prismaService.savedListing.count.mockResolvedValue(1);
    prismaService.savedListing.findMany.mockResolvedValue([
      {
        id: 'saved_1',
        createdAt: new Date('2026-04-02T09:00:00.000Z'),
        listingId: 'listing_1',
        listing: buildListing(),
      },
    ]);
    prismaService.unlock.findMany.mockResolvedValue([{ listingId: 'listing_1' }]);

    const result = await service.listSavedListings('user_1', 1, 20);

    expect(result.pagination.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.listing.isUnlocked).toBe(true);
  });
});

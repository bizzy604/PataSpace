/**
 * Purpose: Gate tests for AdminListingService — edit and soft-delete guards,
 *   audit logging, and listing-cache invalidation.
 * Why important: Admin edits touch live marketplace data served from cache;
 *   these tests prove every write invalidates the cache and leaves an audit
 *   trail, and that deleted listings cannot be edited.
 * Used by: jest runner via apps/api jest config.
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { AdminListingService } from './admin-listing.service';

const createService = () => {
  const tx = {
    listing: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prismaService = {
    listing: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };
  const listingCacheService = {
    invalidateListing: jest.fn(),
  };

  return {
    prismaService,
    tx,
    listingCacheService,
    service: new AdminListingService(prismaService as never, listingCacheService as never),
  };
};

const storedListing = (overrides = {}) => ({
  id: 'listing_1',
  county: 'Nairobi',
  neighborhood: 'Kilimani',
  monthlyRent: 25000,
  status: ListingStatus.ACTIVE,
  isDeleted: false,
  availableFrom: new Date('2026-04-01T00:00:00.000Z'),
  ...overrides,
});

describe('AdminListingService', () => {
  it('updates listing content, audits, and invalidates the cache', async () => {
    const { prismaService, tx, listingCacheService, service } = createService();
    prismaService.listing.findUnique.mockResolvedValue(storedListing());
    tx.listing.update.mockResolvedValue({ id: 'listing_1', status: ListingStatus.ACTIVE });

    const result = await service.updateListing('admin_1', 'listing_1', {
      monthlyRent: 28000,
      availableFrom: '2026-05-01T00:00:00.000Z',
    });

    expect(result).toMatchObject({ id: 'listing_1', message: 'Listing updated' });
    expect(tx.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { monthlyRent: 28000, availableFrom: new Date('2026-05-01T00:00:00.000Z') },
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'listing.admin_update',
          oldValue: {
            monthlyRent: 25000,
            availableFrom: '2026-04-01T00:00:00.000Z',
          },
        }),
      }),
    );
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
  });

  it('refuses to edit a deleted listing', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.findUnique.mockResolvedValue(storedListing({ isDeleted: true }));

    await expect(
      service.updateListing('admin_1', 'listing_1', { monthlyRent: 30000 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prismaService.$transaction).not.toHaveBeenCalled();
  });

  it('404s on unknown listings', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.findUnique.mockResolvedValue(null);

    await expect(
      service.updateListing('admin_1', 'ghost', { monthlyRent: 30000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteListing('admin_1', 'ghost', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft-deletes a listing with reason metadata and cache invalidation', async () => {
    const { prismaService, tx, listingCacheService, service } = createService();
    prismaService.listing.findUnique.mockResolvedValue(storedListing());
    tx.listing.update.mockResolvedValue({ id: 'listing_1', status: ListingStatus.DELETED });

    const result = await service.deleteListing('admin_1', 'listing_1', {
      reason: 'Confirmed fraudulent',
    });

    expect(result.status).toBe(ListingStatus.DELETED);
    expect(tx.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isDeleted: true, status: ListingStatus.DELETED },
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'listing.admin_delete',
          metadata: { reason: 'Confirmed fraudulent' },
        }),
      }),
    );
    expect(listingCacheService.invalidateListing).toHaveBeenCalledWith('listing_1');
  });

  it('rejects deleting an already deleted listing', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.findUnique.mockResolvedValue(storedListing({ isDeleted: true }));

    await expect(service.deleteListing('admin_1', 'listing_1', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists the catalogue with owner info and pagination', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.count.mockResolvedValue(1);
    prismaService.listing.findMany.mockResolvedValue([
      {
        ...storedListing(),
        houseType: 'ONE_BEDROOM',
        isApproved: true,
        viewCount: 10,
        unlockCount: 2,
        unlockCostCredits: 50,
        commission: 750,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
        user: { id: 'user_1', firstName: 'John', lastName: 'Mwangi' },
      },
    ]);

    const result = await service.listListings({ page: 1, limit: 20 });

    expect(result.data[0]).toMatchObject({
      id: 'listing_1',
      owner: { id: 'user_1', firstName: 'John', lastName: 'Mwangi' },
      isDeleted: false,
    });
    expect(result.meta.total).toBe(1);
  });
});

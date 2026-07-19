/**
 * Purpose: Gate tests for the admin moderation queue payload built by
 *   ListingService.getPendingListings.
 * Why important: The admin console approves listings from this payload; field
 *   testing 2026-07-16 found admins approving blind because media was absent
 *   from the queue UI. These tests pin that photos AND the walkthrough video
 *   URL reach the contract payload.
 * Used by: `pnpm --filter @pataspace/api test` (gate lane).
 */
import { ListingStatus } from '@prisma/client';
import { ListingService } from './listing.service';
import { DEFAULT_PRICING_CONFIG } from './domain/pricing.policy';
import { ListingMediaResolver } from './persistence/listing-media.resolver';

describe('ListingService.getPendingListings', () => {
  const createService = () => {
    const prismaService = {
      listing: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001'),
    };
    const listingCacheService = {};
    const smsService = {};
    const configService = {
      get: jest.fn().mockImplementation((key: string) =>
        key === 'security.encryptionKey' ? '12345678901234567890123456789012' : undefined,
      ),
    };
    const systemConfig = {
      resolvePricingConfig: jest.fn().mockResolvedValue(DEFAULT_PRICING_CONFIG),
    };

    return {
      prismaService,
      service: new ListingService(
        prismaService as never,
        userService as never,
        listingCacheService as never,
        smsService as never,
        new ListingMediaResolver(prismaService as never),
        systemConfig as never,
        configService as never,
      ),
    };
  };

  const pendingRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'listing_1',
    userId: 'owner_1',
    county: 'Nairobi',
    neighborhood: 'Kilimani',
    monthlyRent: 25000,
    houseType: 'TWO_BEDROOM',
    status: ListingStatus.PENDING,
    videoUrl: 'https://cdn.example.com/listings/owner_1/videos/tour.mp4',
    createdAt: new Date('2026-07-10T00:00:00.000Z'),
    photos: [
      { url: 'https://cdn.example.com/listings/owner_1/photos/2.jpg', order: 2, width: null, height: null },
      { url: 'https://cdn.example.com/listings/owner_1/photos/1.jpg', order: 1, width: 1200, height: 900 },
    ],
    user: {
      id: 'owner_1',
      firstName: 'Amoni',
      phoneNumberEncrypted: 'encrypted-phone',
    },
    ...overrides,
  });

  it('includes ordered photo urls and the walkthrough video url', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.findMany.mockResolvedValue([pendingRow()]);
    prismaService.listing.groupBy.mockResolvedValue([
      { userId: 'owner_1', _count: { _all: 3 } },
    ]);

    const response = await service.getPendingListings();

    expect(response.data).toHaveLength(1);
    const listing = response.data[0]!;
    expect(listing.photos.map((photo) => photo.url)).toEqual([
      'https://cdn.example.com/listings/owner_1/photos/2.jpg',
      'https://cdn.example.com/listings/owner_1/photos/1.jpg',
    ]);
    expect(listing.videoUrl).toBe('https://cdn.example.com/listings/owner_1/videos/tour.mp4');
    expect(listing.tenant.phoneNumber).toBe('+254700000001');
    expect(listing.tenant.listingsPosted).toBe(3);
  });

  it('omits videoUrl when the listing has no video', async () => {
    const { prismaService, service } = createService();
    prismaService.listing.findMany.mockResolvedValue([pendingRow({ videoUrl: null })]);
    prismaService.listing.groupBy.mockResolvedValue([]);

    const response = await service.getPendingListings();

    expect(response.data[0]!.videoUrl).toBeUndefined();
  });
});

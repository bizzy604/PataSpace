/**
 * Purpose: Gate tests for the mover-to-poster seed flow: ownership, one seed
 * per confirmation, and the earnings-estimate math.
 * Why important: the flywheel is a launch metric (mover-to-poster rate >25%);
 * a broken seed endpoint silently kills supply growth.
 * Used by: jest unit lane (pnpm test:unit).
 */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_PRICING_CONFIG } from './domain/pricing.policy';
import { ListingSeedService } from './listing-seed.service';

describe('ListingSeedService', () => {
  const createService = () => {
    const prismaService = {
      confirmation: {
        findUnique: jest.fn(),
      },
      listing: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const systemConfig = {
      resolvePricingConfig: jest.fn().mockResolvedValue(DEFAULT_PRICING_CONFIG),
    };

    return {
      prismaService,
      service: new ListingSeedService(prismaService as never, systemConfig as never),
    };
  };

  const createConfirmation = (overrides = {}) => ({
    id: 'confirmation_1',
    userId: 'buyer_1',
    side: 'INCOMING_TENANT',
    unlock: {
      listing: {
        monthlyRent: 25000,
      },
    },
    ...overrides,
  });

  it('returns the seed payload with the earnings estimate', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(createConfirmation());

    const result = await service.seedFromConfirmation('buyer_1', 'confirmation_1');

    // 70% of clamp(10% x 25,000, 1,000, 5,000) = 1,750.
    expect(result).toMatchObject({
      seededFromConfirmationId: 'confirmation_1',
      posterRole: 'OUTGOING_TENANT',
      estimatedEarningsKes: 1750,
      estimateBasisRentKes: 25000,
    });
  });

  it('clamps the estimate for high-rent units', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(
      createConfirmation({
        unlock: {
          listing: {
            monthlyRent: 65000,
          },
        },
      }),
    );

    const result = await service.seedFromConfirmation('buyer_1', 'confirmation_1');

    // Fee caps at 5,000; poster share 3,500.
    expect(result.estimatedEarningsKes).toBe(3500);
  });

  it('rejects seeds from anyone but the confirming mover', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(createConfirmation());

    await expect(
      service.seedFromConfirmation('intruder_1', 'confirmation_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects seeds from the outgoing side of a confirmation', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(
      createConfirmation({
        userId: 'owner_1',
        side: 'OUTGOING_TENANT',
      }),
    );

    await expect(
      service.seedFromConfirmation('owner_1', 'confirmation_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a second seed for the same confirmation', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(createConfirmation());
    prismaService.listing.findUnique.mockResolvedValue({
      id: 'listing_2',
    });

    await expect(
      service.seedFromConfirmation('buyer_1', 'confirmation_1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing confirmations', async () => {
    const { prismaService, service } = createService();

    prismaService.confirmation.findUnique.mockResolvedValue(null);

    await expect(
      service.seedFromConfirmation('buyer_1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

/**
 * Purpose: Gate tests for the v1.2 pilot metrics: landlord_declined refund
 *   share and mover-to-poster rate, including zero-denominator safety.
 * Why important: these ratios gate launch decisions (20% and 25% thresholds);
 *   a division bug here misleads the founder directly.
 * Used by: jest runner via apps/api jest config.
 */
import { AdminTrustMetricsService } from './admin-trust-metrics.service';

describe('AdminTrustMetricsService', () => {
  const createService = () => {
    const prismaService = {
      unlock: { count: jest.fn() },
      listing: { count: jest.fn() },
      successFee: { count: jest.fn(), groupBy: jest.fn() },
    };

    return {
      prismaService,
      service: new AdminTrustMetricsService(prismaService as never),
    };
  };

  it('computes the landlord_declined share and mover-to-poster rate', async () => {
    const { prismaService, service } = createService();

    prismaService.unlock.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
    prismaService.successFee.count.mockResolvedValue(8);
    prismaService.listing.count.mockResolvedValue(2);
    prismaService.successFee.groupBy.mockResolvedValue([
      {
        status: 'PARTIAL',
        _count: { _all: 2 },
        _sum: { creditsApplied: 600, cashCollectedKes: 0 },
      },
      {
        status: 'SETTLED',
        _count: { _all: 6 },
        _sum: { creditsApplied: 1800, cashCollectedKes: 11600 },
      },
    ]);

    const result = await service.getMetrics();

    expect(result).toEqual({
      trust: {
        refundsTotal: 10,
        landlordDeclinedRefunds: 3,
        landlordDeclinedShare: 0.3,
      },
      flywheel: {
        confirmedMoveIns: 8,
        seededListings: 2,
        moverToPosterRate: 0.25,
      },
      successFees: {
        partialCount: 2,
        settledCount: 6,
        collectedKes: 14000,
      },
    });
  });

  it('returns zero ratios instead of dividing by zero', async () => {
    const { prismaService, service } = createService();

    prismaService.unlock.count.mockResolvedValue(0);
    prismaService.successFee.count.mockResolvedValue(0);
    prismaService.listing.count.mockResolvedValue(0);
    prismaService.successFee.groupBy.mockResolvedValue([]);

    const result = await service.getMetrics();

    expect(result.trust.landlordDeclinedShare).toBe(0);
    expect(result.flywheel.moverToPosterRate).toBe(0);
  });
});

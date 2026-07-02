/**
 * Purpose: Gate tests for AdminMetricsService — aggregation mapping and the
 *   seven-day window arithmetic.
 * Why important: These numbers drive ops decisions; a mis-mapped commission
 *   status or wrong date window would misreport money silently.
 * Used by: jest runner via apps/api jest config.
 */
import { CommissionStatus } from '@prisma/client';
import { AdminMetricsService } from './admin-metrics.service';

describe('AdminMetricsService', () => {
  const createService = () => {
    const prismaService = {
      user: { count: jest.fn() },
      listing: { count: jest.fn() },
      unlock: { count: jest.fn() },
      dispute: { count: jest.fn() },
      commission: { groupBy: jest.fn() },
      supportTicket: { count: jest.fn() },
    };

    return { prismaService, service: new AdminMetricsService(prismaService as never) };
  };

  it('maps every aggregate into the dashboard payload', async () => {
    const { prismaService, service } = createService();
    prismaService.user.count
      .mockResolvedValueOnce(1250)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(85);
    prismaService.listing.count
      .mockResolvedValueOnce(430)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(310)
      .mockResolvedValueOnce(25);
    prismaService.unlock.count.mockResolvedValueOnce(890).mockResolvedValueOnce(43);
    prismaService.dispute.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    prismaService.commission.groupBy.mockResolvedValue([
      { status: CommissionStatus.PENDING, _count: { _all: 9 }, _sum: { amountKES: 6750 } },
      { status: CommissionStatus.PAID, _count: { _all: 120 }, _sum: { amountKES: 90000 } },
    ]);
    prismaService.supportTicket.count.mockResolvedValue(3);

    const now = new Date('2026-07-02T10:00:00.000Z');
    const result = await service.getMetrics(now);

    expect(result).toEqual({
      users: { total: 1250, banned: 12, newLast7Days: 85 },
      listings: { total: 430, pending: 12, active: 310, rejected: 25 },
      unlocks: { total: 890, last7Days: 43 },
      disputes: { open: 4, investigating: 2 },
      commissions: {
        pendingCount: 9,
        pendingAmountKES: 6750,
        paidCount: 120,
        paidAmountKES: 90000,
      },
      supportTickets: { open: 3 },
      generatedAt: '2026-07-02T10:00:00.000Z',
    });
    // The "new users" window is exactly seven days before `now`.
    expect(prismaService.user.count).toHaveBeenCalledWith({
      where: { createdAt: { gte: new Date('2026-06-25T10:00:00.000Z') } },
    });
  });

  it('reports zero commissions when no rows exist for a status', async () => {
    const { prismaService, service } = createService();
    prismaService.user.count.mockResolvedValue(0);
    prismaService.listing.count.mockResolvedValue(0);
    prismaService.unlock.count.mockResolvedValue(0);
    prismaService.dispute.count.mockResolvedValue(0);
    prismaService.commission.groupBy.mockResolvedValue([]);
    prismaService.supportTicket.count.mockResolvedValue(0);

    const result = await service.getMetrics();

    expect(result.commissions).toEqual({
      pendingCount: 0,
      pendingAmountKES: 0,
      paidCount: 0,
      paidAmountKES: 0,
    });
  });
});

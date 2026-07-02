/**
 * Purpose: Gate tests for AdminDisputeService — queue mapping and status
 *   filtering.
 * Why important: The console works refund decisions from this queue; a
 *   mis-mapped reporter or missing filter would route disputes to the wrong
 *   context.
 * Used by: jest runner via apps/api jest config.
 */
import { DisputeStatus } from '@prisma/client';
import { AdminDisputeService } from './admin-dispute.service';

const createService = () => {
  const prismaService = {
    dispute: { count: jest.fn(), findMany: jest.fn() },
  };

  return { prismaService, service: new AdminDisputeService(prismaService as never) };
};

describe('AdminDisputeService', () => {
  it('maps disputes with reporter and listing context', async () => {
    const { prismaService, service } = createService();
    prismaService.dispute.count.mockResolvedValue(1);
    prismaService.dispute.findMany.mockResolvedValue([
      {
        id: 'dispute_1',
        unlockId: 'unlock_1',
        status: DisputeStatus.OPEN,
        reason: 'Photos did not match',
        evidence: ['a.jpg', 'b.jpg'],
        resolution: null,
        resolvedAt: null,
        createdAt: new Date('2026-06-28T10:00:00.000Z'),
        user: { id: 'user_1', firstName: 'John', lastName: 'Mwangi' },
        unlock: {
          listing: { id: 'listing_1', county: 'Nairobi', neighborhood: 'Kilimani' },
        },
      },
    ]);

    const result = await service.listDisputes({ page: 1, limit: 20 });

    expect(result.data[0]).toEqual({
      id: 'dispute_1',
      unlockId: 'unlock_1',
      status: DisputeStatus.OPEN,
      reason: 'Photos did not match',
      evidenceCount: 2,
      reportedBy: { id: 'user_1', firstName: 'John', lastName: 'Mwangi' },
      listing: { id: 'listing_1', county: 'Nairobi', neighborhood: 'Kilimani' },
      resolution: null,
      resolvedAt: null,
      createdAt: '2026-06-28T10:00:00.000Z',
    });
    expect(prismaService.dispute.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('filters by status when provided', async () => {
    const { prismaService, service } = createService();
    prismaService.dispute.count.mockResolvedValue(0);
    prismaService.dispute.findMany.mockResolvedValue([]);

    await service.listDisputes({
      page: 1,
      limit: 20,
      status: DisputeStatus.INVESTIGATING as never,
    });

    expect(prismaService.dispute.count).toHaveBeenCalledWith({
      where: { status: DisputeStatus.INVESTIGATING },
    });
  });
});

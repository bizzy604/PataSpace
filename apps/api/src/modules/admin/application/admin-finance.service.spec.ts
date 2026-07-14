/**
 * Purpose: Gate tests for AdminFinanceService — summary aggregation buckets,
 *   distinct-partner counting, and ledger mapping + filter building.
 * Why important: These are money figures on an operator screen; a wrong bucket
 *   or a dropped filter would misstate what the platform owes.
 * Used by: jest runner via apps/api jest config.
 */
import { CommissionStatus } from '@prisma/client';
import { AdminFinanceService } from './admin-finance.service';

const createService = () => {
  const prismaService = {
    commission: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    prismaService,
    service: new AdminFinanceService(prismaService as never),
  };
};

const ledgerRow = (overrides = {}) => ({
  id: 'commission_1',
  unlockId: 'unlock_1',
  status: CommissionStatus.FAILED,
  amountKES: 12500,
  mpesaReceiptNumber: null,
  paymentAttempts: 3,
  lastAttemptError: 'Invalid MSISDN',
  eligibleAt: new Date('2026-07-06T09:00:00.000Z'),
  paidAt: null,
  createdAt: new Date('2026-07-01T09:00:00.000Z'),
  unlock: {
    listing: {
      id: 'listing_1',
      county: 'Nairobi',
      neighborhood: 'Kilimani',
      user: { id: 'poster_1', firstName: 'Grace', lastName: 'Wanjiru' },
    },
  },
  ...overrides,
});

describe('AdminFinanceService', () => {
  it('builds summary tiles from four aggregates plus a distinct-partner count', async () => {
    const { prismaService, service } = createService();
    prismaService.commission.aggregate
      .mockResolvedValueOnce({ _sum: { amountKES: 452000 }, _count: { _all: 8 } }) // in-flight
      .mockResolvedValueOnce({ _sum: { amountKES: 8500 }, _count: { _all: 1 } }) // failed
      .mockResolvedValueOnce({ _sum: { amountKES: 1200000 }, _count: { _all: 30 } }) // month
      .mockResolvedValueOnce({ _sum: { amountKES: 8500200 }, _count: { _all: 210 } }); // ytd
    prismaService.commission.findMany.mockResolvedValue([
      { unlock: { listing: { userId: 'a' } } },
      { unlock: { listing: { userId: 'b' } } },
      { unlock: { listing: { userId: 'a' } } },
    ]);

    const summary = await service.getSummary(new Date('2026-07-13T09:00:00.000Z'));

    expect(summary.pendingPayouts).toEqual({ amountKES: 452000, count: 8, partners: 2 });
    expect(summary.failedPayouts).toEqual({ amountKES: 8500, count: 1 });
    expect(summary.paidThisMonth).toEqual({ amountKES: 1200000, count: 30 });
    expect(summary.paidYearToDate).toEqual({ amountKES: 8500200, count: 210 });
    expect(summary.generatedAt).toBe('2026-07-13T09:00:00.000Z');
  });

  it('treats a null aggregate sum as zero', async () => {
    const { prismaService, service } = createService();
    prismaService.commission.aggregate.mockResolvedValue({
      _sum: { amountKES: null },
      _count: { _all: 0 },
    });
    prismaService.commission.findMany.mockResolvedValue([]);

    const summary = await service.getSummary();

    expect(summary.pendingPayouts).toEqual({ amountKES: 0, count: 0, partners: 0 });
  });

  it('maps ledger rows and reports pagination meta', async () => {
    const { prismaService, service } = createService();
    prismaService.commission.count.mockResolvedValue(45);
    prismaService.commission.findMany.mockResolvedValue([ledgerRow()]);

    const result = await service.listPayouts({ page: 1, limit: 20 });

    expect(result.data[0]).toEqual({
      id: 'commission_1',
      unlockId: 'unlock_1',
      status: CommissionStatus.FAILED,
      amountKES: 12500,
      mpesaReceiptNumber: null,
      paymentAttempts: 3,
      lastAttemptError: 'Invalid MSISDN',
      payee: { id: 'poster_1', firstName: 'Grace', lastName: 'Wanjiru' },
      listing: { id: 'listing_1', county: 'Nairobi', neighborhood: 'Kilimani' },
      eligibleAt: '2026-07-06T09:00:00.000Z',
      paidAt: null,
      createdAt: '2026-07-01T09:00:00.000Z',
    });
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
  });

  it('applies status and search filters to the ledger query', async () => {
    const { prismaService, service } = createService();
    prismaService.commission.count.mockResolvedValue(0);
    prismaService.commission.findMany.mockResolvedValue([]);

    await service.listPayouts({
      page: 2,
      limit: 10,
      status: CommissionStatus.FAILED as never,
      search: 'kilimani',
    });

    const where = prismaService.commission.count.mock.calls[0][0].where;
    expect(where.status).toBe(CommissionStatus.FAILED);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { id: { contains: 'kilimani', mode: 'insensitive' } },
        { mpesaReceiptNumber: { contains: 'kilimani', mode: 'insensitive' } },
      ]),
    );
    const findArgs = prismaService.commission.findMany.mock.calls[0][0];
    expect(findArgs.skip).toBe(10);
    expect(findArgs.take).toBe(10);
  });
});

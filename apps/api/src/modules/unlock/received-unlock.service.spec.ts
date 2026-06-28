import { CommissionStatus, ConfirmationSide, DisputeStatus } from '@prisma/client';
import { ReceivedUnlockService } from './received-unlock.service';

describe('ReceivedUnlockService', () => {
  const createService = () => {
    const prismaService = {
      unlock: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    return {
      prismaService,
      service: new ReceivedUnlockService(prismaService as never),
    };
  };

  const baseUnlock = (overrides: Record<string, unknown> = {}) => ({
    id: 'unlock_1',
    isRefunded: false,
    createdAt: new Date('2026-03-20T14:00:00.000Z'),
    confirmations: [],
    dispute: null,
    commission: null,
    listing: {
      id: 'listing_1',
      neighborhood: 'Kilimani',
      monthlyRent: 25000,
      bedrooms: 2,
    },
    ...overrides,
  });

  it('scopes the query to unlocks on the owner listings', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([0, []]);

    await service.getReceivedUnlocks('owner_1', {});

    const where = prismaService.unlock.count.mock.calls[0][0].where;
    expect(where.listing).toEqual({ is: { userId: 'owner_1' } });
  });

  it('builds an awaiting_confirmation filter excluding owner-confirmed and disputed unlocks', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([0, []]);

    await service.getReceivedUnlocks('owner_1', { status: 'awaiting_confirmation' });

    const where = prismaService.unlock.findMany.mock.calls[0][0].where;
    expect(where.isRefunded).toBe(false);
    expect(where.confirmations).toEqual({
      none: { side: ConfirmationSide.OUTGOING_TENANT },
    });
    expect(where.NOT).toEqual({
      dispute: {
        is: { status: { in: [DisputeStatus.OPEN, DisputeStatus.INVESTIGATING] } },
      },
    });
  });

  it('maps confirmation sides and pending status for an unconfirmed unlock', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([
      1,
      [
        baseUnlock({
          confirmations: [
            { side: ConfirmationSide.INCOMING_TENANT, confirmedAt: new Date() },
          ],
        }),
      ],
    ]);

    const result = await service.getReceivedUnlocks('owner_1', {});
    const record = result.data[0];

    expect(record.unlockId).toBe('unlock_1');
    expect(record.incomingConfirmed).toBe(true);
    expect(record.outgoingConfirmed).toBe(false);
    expect(record.status).toBe('pending_confirmation');
    expect(record.commission).toBeNull();
    expect(record.listing.neighborhood).toBe('Kilimani');
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('maps a fully confirmed unlock with its commission summary', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([
      1,
      [
        baseUnlock({
          confirmations: [
            { side: ConfirmationSide.INCOMING_TENANT, confirmedAt: new Date() },
            { side: ConfirmationSide.OUTGOING_TENANT, confirmedAt: new Date() },
          ],
          commission: {
            amountKES: 750,
            status: CommissionStatus.PENDING,
            eligibleAt: new Date('2026-03-27T14:00:00.000Z'),
          },
        }),
      ],
    ]);

    const record = (await service.getReceivedUnlocks('owner_1', {})).data[0];

    expect(record.incomingConfirmed).toBe(true);
    expect(record.outgoingConfirmed).toBe(true);
    expect(record.status).toBe('confirmed');
    expect(record.commission).toEqual({
      amountKES: 750,
      status: CommissionStatus.PENDING,
      payableOn: '2026-03-27T14:00:00.000Z',
    });
  });

  it('reports a refunded unlock as refunded regardless of confirmations', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([
      1,
      [baseUnlock({ isRefunded: true })],
    ]);

    const record = (await service.getReceivedUnlocks('owner_1', {})).data[0];

    expect(record.status).toBe('refunded');
    expect(record.isRefunded).toBe(true);
  });

  it('flags an actively disputed unlock as disputed', async () => {
    const { service, prismaService } = createService();
    prismaService.$transaction.mockResolvedValue([
      1,
      [baseUnlock({ dispute: { status: DisputeStatus.OPEN } })],
    ]);

    const record = (await service.getReceivedUnlocks('owner_1', {})).data[0];

    expect(record.status).toBe('disputed');
  });
});

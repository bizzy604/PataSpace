/**
 * Purpose: Gate tests for proxy session allocation and lifecycle: pool
 * load-balancing, masking flag behavior, and expiry semantics.
 * Why important: a wrong allocation bridges strangers; a missed expiry keeps
 * a dead line open.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ProxySessionService } from './proxy-session.service';

describe('ProxySessionService', () => {
  const createService = (contactConfig?: Record<string, unknown>) => {
    const prismaService = {
      proxySession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    const configService = {
      get: jest.fn().mockImplementation((key: string) =>
        key === 'contact'
          ? {
              maskingEnabled: true,
              virtualNumbers: ['+254207000001', '+254207000002'],
              sessionTtlHours: 72,
              postCaptureTtlDays: 7,
              ...contactConfig,
            }
          : undefined,
      ),
    };

    return {
      prismaService,
      service: new ProxySessionService(prismaService as never, configService as never),
    };
  };

  it('is disabled without a configured number pool', async () => {
    const { prismaService, service } = createService({ virtualNumbers: [] });

    expect(service.maskingEnabled).toBe(false);
    await expect(service.createForUnlock(prismaService as never, 'unlock_1')).resolves.toBeNull();
    expect(prismaService.proxySession.create).not.toHaveBeenCalled();
  });

  it('allocates the least-loaded virtual number', async () => {
    const { prismaService, service } = createService();

    prismaService.proxySession.groupBy.mockResolvedValue([
      {
        virtualMsisdn: '+254207000001',
        _count: {
          _all: 3,
        },
      },
      {
        virtualMsisdn: '+254207000002',
        _count: {
          _all: 1,
        },
      },
    ]);
    prismaService.proxySession.create.mockImplementation(({ data }: never) =>
      Promise.resolve({
        virtualMsisdn: (data as { virtualMsisdn: string }).virtualMsisdn,
        expiresAt: (data as { expiresAt: Date }).expiresAt,
      }),
    );

    const session = await service.createForUnlock(prismaService as never, 'unlock_1');

    expect(session?.virtualMsisdn).toBe('+254207000002');
    expect(prismaService.proxySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unlockId: 'unlock_1',
          virtualMsisdn: '+254207000002',
        }),
      }),
    );
  });

  it('sets the session TTL from config on creation', async () => {
    const { prismaService, service } = createService({ sessionTtlHours: 1 });
    const before = Date.now();

    prismaService.proxySession.create.mockImplementation(({ data }: never) =>
      Promise.resolve({
        virtualMsisdn: (data as { virtualMsisdn: string }).virtualMsisdn,
        expiresAt: (data as { expiresAt: Date }).expiresAt,
      }),
    );

    const session = await service.createForUnlock(prismaService as never, 'unlock_1');
    const expectedExpiry = before + 60 * 60 * 1000;

    expect(session?.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
    expect(session?.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 5000);
  });

  it('expires all active sessions of an unlock', async () => {
    const { prismaService, service } = createService();

    await service.expireForUnlock(prismaService as never, 'unlock_1');

    expect(prismaService.proxySession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unlockId: 'unlock_1',
          status: 'ACTIVE',
        }),
        data: expect.objectContaining({
          status: 'EXPIRED',
        }),
      }),
    );
  });

  it('records poster response telemetry only for the first response', async () => {
    const { prismaService, service } = createService();

    await service.recordInboundCall('session_1', true);

    expect(prismaService.proxySession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          callCount: {
            increment: 1,
          },
        }),
      }),
    );
    expect(prismaService.proxySession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'session_1',
          firstPosterResponseAt: null,
        }),
      }),
    );
  });
});

/**
 * Purpose: Gate tests for AdminAuditService — filter composition, record
 *   mapping (admin join + JSON payloads), and the export cap.
 * Why important: The where-clause is what scopes a security review; a dropped
 *   filter would leak the whole trail into a supposedly narrow query.
 * Used by: jest runner via apps/api jest config.
 */
import { AdminAuditService } from './admin-audit.service';

const createService = () => {
  const prismaService = {
    auditLog: { count: jest.fn(), findMany: jest.fn() },
  };
  return { prismaService, service: new AdminAuditService(prismaService as never) };
};

const auditRow = () => ({
  id: 'audit_1',
  action: 'user.ban',
  entityType: 'User',
  entityId: 'user_1',
  oldValue: { status: 'active' },
  newValue: { status: 'banned' },
  metadata: null,
  ipAddress: '196.201.214.10',
  createdAt: new Date('2026-07-14T09:45:00.000Z'),
  user: { id: 'admin_1', firstName: 'Ada', lastName: 'Njeri' },
});

describe('AdminAuditService', () => {
  it('composes filters including a date range and maps the admin join', async () => {
    const { prismaService, service } = createService();
    prismaService.auditLog.count.mockResolvedValue(1);
    prismaService.auditLog.findMany.mockResolvedValue([auditRow()]);

    const result = await service.listLogs({
      page: 2,
      limit: 25,
      action: 'user.ban',
      entityType: 'User',
      adminUserId: 'admin_1',
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-14T23:59:59.000Z',
    });

    const where = prismaService.auditLog.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ action: 'user.ban', entityType: 'User', userId: 'admin_1' });
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01T00:00:00.000Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-14T23:59:59.000Z'));
    expect(prismaService.auditLog.findMany.mock.calls[0][0].skip).toBe(25);
    expect(result.data[0]).toMatchObject({
      action: 'user.ban',
      admin: { id: 'admin_1', firstName: 'Ada', lastName: 'Njeri' },
      newValue: { status: 'banned' },
    });
    expect(result.meta).toEqual({ page: 2, limit: 25, total: 1, totalPages: 1 });
  });

  it('maps a system row (no admin) to a null actor', async () => {
    const { prismaService, service } = createService();
    prismaService.auditLog.count.mockResolvedValue(1);
    prismaService.auditLog.findMany.mockResolvedValue([{ ...auditRow(), user: null }]);

    const result = await service.listLogs({ page: 1, limit: 20 });

    expect(result.data[0].admin).toBeNull();
    expect(prismaService.auditLog.findMany.mock.calls[0][0].where).toEqual({});
  });

  it('caps the export at 10k rows and returns CSV', async () => {
    const { prismaService, service } = createService();
    prismaService.auditLog.findMany.mockResolvedValue([auditRow()]);

    const csv = await service.collectCsv({ page: 1, limit: 20, action: 'user.ban' });

    expect(prismaService.auditLog.findMany.mock.calls[0][0].take).toBe(10_000);
    expect(csv.split('\r\n')[0]).toContain('id,createdAt,action');
    expect(csv).toContain('user.ban');
  });
});

import { Role } from '@prisma/client';
import { NotificationJob } from './notification.job';

describe('NotificationJob', () => {
  const createJob = () => {
    const prismaService = {
      user: {
        findMany: jest.fn(),
      },
      auditLog: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    const smsService = {
      sendMessage: jest.fn(),
    };
    const userService = {
      decryptPhoneNumber: jest.fn().mockReturnValue('+254700000001'),
    };

    return {
      prismaService,
      smsService,
      userService,
      job: new NotificationJob(
        prismaService as never,
        smsService as never,
        userService as never,
      ),
    };
  };

  it('sends admin alerts once for background failures', async () => {
    const { job, prismaService, smsService } = createJob();

    prismaService.user.findMany.mockResolvedValue([
      {
        id: 'admin_1',
        role: Role.ADMIN,
        phoneNumberEncrypted: 'encrypted-phone',
      },
    ]);
    prismaService.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit_1',
        action: 'commission.dead_lettered',
        entityType: 'Commission',
        entityId: 'commission_1',
        metadata: {
          paymentAttempts: 3,
        },
      },
    ]);
    prismaService.auditLog.findFirst.mockResolvedValue(null);

    const summary = await job.dispatchOperationalAlerts(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.sent).toBe(1);
    expect(smsService.sendMessage).toHaveBeenCalledWith(
      '+254700000001',
      expect.stringContaining('commission commission_1 failed after 3 attempts'),
    );
    expect(prismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'notification.background_alert_sent',
        entityType: 'AuditLog',
        entityId: 'audit_1',
      }),
    });
  });

  it('skips alerts that were already sent', async () => {
    const { job, prismaService, smsService } = createJob();

    prismaService.user.findMany.mockResolvedValue([
      {
        id: 'admin_1',
        role: Role.ADMIN,
        phoneNumberEncrypted: 'encrypted-phone',
      },
    ]);
    prismaService.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit_1',
        action: 'listing.cleanup_failed',
        entityType: 'Listing',
        entityId: 'listing_1',
        metadata: null,
      },
    ]);
    prismaService.auditLog.findFirst.mockResolvedValue({
      id: 'audit_sent_1',
    });

    const summary = await job.dispatchOperationalAlerts(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.skippedAlreadySent).toBe(1);
    expect(smsService.sendMessage).not.toHaveBeenCalled();
    expect(prismaService.auditLog.create).not.toHaveBeenCalled();
  });

  it('skips alerts when there are no active admins to notify', async () => {
    const { job, prismaService, smsService } = createJob();

    prismaService.user.findMany.mockResolvedValue([]);
    prismaService.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit_1',
        action: 'commission.dead_lettered',
        entityType: 'Commission',
        entityId: 'commission_1',
        metadata: {
          paymentAttempts: 3,
        },
      },
    ]);
    prismaService.auditLog.findFirst.mockResolvedValue(null);

    const summary = await job.dispatchOperationalAlerts(new Date('2026-04-02T06:00:00.000Z'));

    expect(summary.skippedNoAdmins).toBe(1);
    expect(smsService.sendMessage).not.toHaveBeenCalled();
    expect(prismaService.auditLog.create).not.toHaveBeenCalled();
  });
});

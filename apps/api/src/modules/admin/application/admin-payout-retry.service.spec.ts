/**
 * Purpose: Gate tests for AdminPayoutRetryService — the FAILED-only guard, the
 *   claim-guarded flip, audit logging, and that paymentAttempts is preserved
 *   so the processor's confirm-before-resend protection survives a retry.
 * Why important: This path re-sends real money; a hole here risks a double
 *   payout or retrying a row that a callback already settled.
 * Used by: jest runner via apps/api jest config.
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommissionStatus } from '@prisma/client';
import { AdminPayoutRetryService } from './admin-payout-retry.service';

const failedCommission = (overrides = {}) => ({
  id: 'commission_1',
  unlockId: 'unlock_1',
  amountKES: 8500,
  status: CommissionStatus.FAILED,
  paymentAttempts: 3,
  originatorConversationId: 'pataspace-abc',
  unlock: {
    dispute: null,
    listing: { id: 'listing_1', neighborhood: 'Kilimani', user: { phoneNumberEncrypted: 'enc' } },
  },
  ...overrides,
});

const createService = () => {
  const prismaService = {
    commission: { findUnique: jest.fn(), updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const processor = { process: jest.fn() };
  return {
    prismaService,
    processor,
    service: new AdminPayoutRetryService(prismaService as never, processor as never),
  };
};

describe('AdminPayoutRetryService', () => {
  it('requeues a failed payout, preserves attempts, audits, and reports the outcome', async () => {
    const { prismaService, processor, service } = createService();
    prismaService.commission.findUnique
      .mockResolvedValueOnce(failedCommission())
      .mockResolvedValueOnce({ status: CommissionStatus.PROCESSING });
    prismaService.commission.updateMany.mockResolvedValue({ count: 1 });
    processor.process.mockResolvedValue('submitted');

    const result = await service.retry('admin_1', 'commission_1', new Date('2026-07-13T09:00:00.000Z'));

    expect(prismaService.commission.updateMany).toHaveBeenCalledWith({
      where: { id: 'commission_1', status: CommissionStatus.FAILED },
      data: { status: CommissionStatus.DUE, lastAttemptError: null },
    });
    // Attempts must NOT reset — the confirm-before-resend guard depends on it.
    expect(processor.process.mock.calls[0][0].paymentAttempts).toBe(3);
    expect(prismaService.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'admin_1',
          action: 'commission.payout_retried',
          entityId: 'commission_1',
        }),
      }),
    );
    expect(result).toEqual({
      commissionId: 'commission_1',
      outcome: 'submitted',
      status: CommissionStatus.PROCESSING,
    });
  });

  it('rejects a missing commission', async () => {
    const { prismaService, service } = createService();
    prismaService.commission.findUnique.mockResolvedValue(null);

    await expect(service.retry('admin_1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to retry a non-failed payout', async () => {
    const { prismaService, processor, service } = createService();
    prismaService.commission.findUnique.mockResolvedValue(
      failedCommission({ status: CommissionStatus.PAID }),
    );

    await expect(service.retry('admin_1', 'commission_1')).rejects.toBeInstanceOf(ConflictException);
    expect(processor.process).not.toHaveBeenCalled();
  });

  it('refuses when the claim flip loses the race', async () => {
    const { prismaService, processor, service } = createService();
    prismaService.commission.findUnique.mockResolvedValue(failedCommission());
    prismaService.commission.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.retry('admin_1', 'commission_1')).rejects.toBeInstanceOf(ConflictException);
    expect(processor.process).not.toHaveBeenCalled();
  });
});

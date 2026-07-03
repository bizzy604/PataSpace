/**
 * Purpose: Gate tests for report-dead: reporter authorization, reason-code
 * propagation, and refusal after the seeker already confirmed.
 * Why important: report-dead moves money on one tap; only the paying seeker
 * may trigger it, exactly once, with an honest reason code.
 * Used by: jest unit lane (pnpm test:unit).
 */
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { UnlockDeadReason } from '@pataspace/contracts';
import { ReportDeadService } from './report-dead.service';

describe('ReportDeadService', () => {
  const createReportDeadService = () => {
    const prismaService = {
      unlock: {
        findUnique: jest.fn(),
      },
    };
    const creditService = {
      getCurrentBalanceValue: jest.fn().mockResolvedValue(2800),
    };
    const unlockRefundService = {
      refundUnlock: jest.fn(),
    };

    return {
      creditService,
      prismaService,
      unlockRefundService,
      service: new ReportDeadService(
        prismaService as never,
        creditService as never,
        unlockRefundService as never,
      ),
    };
  };

  const createStoredUnlock = (overrides = {}) => ({
    id: 'unlock_1',
    buyerId: 'buyer_1',
    creditsSpent: 300,
    isRefunded: false,
    confirmations: [],
    ...overrides,
  });

  it('refunds with the reason code and returns the new balance', async () => {
    const { prismaService, service, unlockRefundService } = createReportDeadService();

    prismaService.unlock.findUnique.mockResolvedValue(createStoredUnlock());

    const result = await service.reportDead('buyer_1', 'unlock_1', {
      reason: UnlockDeadReason.LANDLORD_DECLINED,
      comment: 'Landlord has his own tenant queue',
    });

    expect(unlockRefundService.refundUnlock).toHaveBeenCalledWith(
      'unlock_1',
      'Landlord declined the move-in',
      expect.objectContaining({
        deadReason: 'LANDLORD_DECLINED',
        comment: 'Landlord has his own tenant queue',
      }),
    );
    expect(result).toMatchObject({
      unlockId: 'unlock_1',
      reason: UnlockDeadReason.LANDLORD_DECLINED,
      creditsRefunded: 300,
      newBalance: 2800,
    });
  });

  it('rejects reports from anyone but the buying seeker', async () => {
    const { prismaService, service, unlockRefundService } = createReportDeadService();

    prismaService.unlock.findUnique.mockResolvedValue(createStoredUnlock());

    await expect(
      service.reportDead('intruder_1', 'unlock_1', {
        reason: UnlockDeadReason.OCCUPIED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(unlockRefundService.refundUnlock).not.toHaveBeenCalled();
  });

  it('rejects reports on missing unlocks', async () => {
    const { prismaService, service } = createReportDeadService();

    prismaService.unlock.findUnique.mockResolvedValue(null);

    await expect(
      service.reportDead('buyer_1', 'missing', {
        reason: UnlockDeadReason.FAKE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects double refunds', async () => {
    const { prismaService, service } = createReportDeadService();

    prismaService.unlock.findUnique.mockResolvedValue(
      createStoredUnlock({ isRefunded: true }),
    );

    await expect(
      service.reportDead('buyer_1', 'unlock_1', {
        reason: UnlockDeadReason.OCCUPIED,
      }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejects reports after the seeker already confirmed the move-in', async () => {
    const { prismaService, service } = createReportDeadService();

    prismaService.unlock.findUnique.mockResolvedValue(
      createStoredUnlock({
        confirmations: [
          {
            userId: 'buyer_1',
          },
        ],
      }),
    );

    await expect(
      service.reportDead('buyer_1', 'unlock_1', {
        reason: UnlockDeadReason.UNRESPONSIVE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

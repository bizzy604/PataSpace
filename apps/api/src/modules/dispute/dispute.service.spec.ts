import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ConfirmationSide,
  DisputeStatus,
  Role,
} from '@prisma/client';
import { DisputeService } from './dispute.service';

describe('DisputeService', () => {
  const createDisputeService = () => {
    const prismaService = {
      $transaction: jest.fn(),
      auditLog: {
        create: jest.fn(),
      },
      dispute: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      unlock: {
        findUnique: jest.fn(),
      },
    };
    const unlockService = {
      refundUnlockById: jest.fn(),
    };
    const confirmationService = {
      ensureCommissionForUnlock: jest.fn(),
    };

    return {
      prismaService,
      unlockService,
      confirmationService,
      service: new DisputeService(
        prismaService as never,
        unlockService as never,
        confirmationService as never,
      ),
    };
  };

  it('resolves disputes with refunds through the unlock refund flow', async () => {
    const { confirmationService, prismaService, service, unlockService } =
      createDisputeService();
    const transactionClient = {
      auditLog: {
        create: jest.fn(),
      },
      dispute: {
        update: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    prismaService.dispute.findUnique
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        status: DisputeStatus.OPEN,
        unlock: {
          id: 'unlock_1',
          isRefunded: false,
          confirmations: [],
        },
      })
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        reportedBy: 'buyer_1',
        reason: 'Listing details did not match',
        evidence: [],
        status: DisputeStatus.RESOLVED,
        resolution: 'Listing invalid',
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        resolvedAt: new Date('2026-03-24T09:00:00.000Z'),
        unlock: {
          buyerId: 'buyer_1',
          creditsSpent: 2500,
          isRefunded: true,
          listing: {
            userId: 'owner_1',
          },
        },
      });

    const result = await service.resolveDispute('admin_1', 'dispute_1', {
      action: 'FULL_REFUND',
      resolution: 'Listing invalid',
    });

    expect(unlockService.refundUnlockById).toHaveBeenCalledWith(
      'unlock_1',
      'Listing invalid',
    );
    expect(confirmationService.ensureCommissionForUnlock).not.toHaveBeenCalled();
    expect(transactionClient.dispute.update).toHaveBeenCalledWith({
      where: {
        id: 'dispute_1',
      },
      data: expect.objectContaining({
        resolvedBy: 'admin_1',
        resolution: 'Listing invalid',
        status: DisputeStatus.RESOLVED,
      }),
    });
    expect(result).toMatchObject({
      id: 'dispute_1',
      refundAmount: 2500,
      resolution: 'Listing invalid',
      status: 'RESOLVED',
    });
  });

  it('restores commission eligibility after a no-refund resolution when both sides had confirmed', async () => {
    const { confirmationService, prismaService, service, unlockService } =
      createDisputeService();
    const transactionClient = {
      auditLog: {
        create: jest.fn(),
      },
      dispute: {
        update: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    prismaService.dispute.findUnique
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        status: DisputeStatus.INVESTIGATING,
        unlock: {
          id: 'unlock_1',
          isRefunded: false,
          confirmations: [
            {
              side: ConfirmationSide.INCOMING_TENANT,
            },
            {
              side: ConfirmationSide.OUTGOING_TENANT,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        reportedBy: 'buyer_1',
        reason: 'Listing details did not match',
        evidence: [],
        status: DisputeStatus.RESOLVED,
        resolution: 'No refund warranted',
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        resolvedAt: new Date('2026-03-24T09:00:00.000Z'),
        unlock: {
          buyerId: 'buyer_1',
          creditsSpent: 2500,
          isRefunded: false,
          listing: {
            userId: 'owner_1',
          },
        },
      });

    await service.resolveDispute('admin_1', 'dispute_1', {
      action: 'NO_REFUND',
      resolution: 'No refund warranted',
    });

    expect(unlockService.refundUnlockById).not.toHaveBeenCalled();
    expect(confirmationService.ensureCommissionForUnlock).toHaveBeenCalledWith('unlock_1');
  });

  it('closes resolved disputes', async () => {
    const { prismaService, service } = createDisputeService();
    const transactionClient = {
      auditLog: {
        create: jest.fn(),
      },
      dispute: {
        update: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    prismaService.dispute.findUnique
      .mockResolvedValueOnce({
        id: 'dispute_1',
        status: DisputeStatus.RESOLVED,
      })
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        reportedBy: 'buyer_1',
        reason: 'Mismatch',
        evidence: [],
        status: DisputeStatus.CLOSED,
        resolution: 'Handled',
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        resolvedAt: new Date('2026-03-24T09:00:00.000Z'),
        unlock: {
          buyerId: 'buyer_1',
          creditsSpent: 0,
          isRefunded: false,
          listing: {
            userId: 'owner_1',
          },
        },
      });

    const result = await service.closeDispute('admin_1', 'dispute_1');

    expect(transactionClient.dispute.update).toHaveBeenCalledWith({
      where: {
        id: 'dispute_1',
      },
      data: {
        status: DisputeStatus.CLOSED,
      },
    });
    expect(result).toMatchObject({
      id: 'dispute_1',
      status: 'CLOSED',
    });
  });

  it('moves open disputes into investigation and records the audit trail', async () => {
    const { prismaService, service } = createDisputeService();
    const transactionClient = {
      auditLog: {
        create: jest.fn(),
      },
      dispute: {
        update: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback: Function) =>
      callback(transactionClient),
    );
    prismaService.dispute.findUnique
      .mockResolvedValueOnce({
        id: 'dispute_1',
        status: DisputeStatus.OPEN,
      })
      .mockResolvedValueOnce({
        id: 'dispute_1',
        unlockId: 'unlock_1',
        reportedBy: 'buyer_1',
        reason: 'Mismatch',
        evidence: [],
        status: DisputeStatus.INVESTIGATING,
        resolution: null,
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        resolvedAt: null,
        unlock: {
          buyerId: 'buyer_1',
          creditsSpent: 0,
          isRefunded: false,
          listing: {
            userId: 'owner_1',
          },
        },
      });

    const result = await service.investigateDispute('admin_1', 'dispute_1');

    expect(transactionClient.dispute.update).toHaveBeenCalledWith({
      where: {
        id: 'dispute_1',
      },
      data: {
        status: DisputeStatus.INVESTIGATING,
      },
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'dispute.investigate',
        entityId: 'dispute_1',
        entityType: 'Dispute',
        userId: 'admin_1',
      },
    });
    expect(result).toMatchObject({
      id: 'dispute_1',
      status: 'INVESTIGATING',
    });
  });

  it('rejects duplicate dispute creation for the same unlock', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.unlock.findUnique.mockResolvedValue({
      id: 'unlock_1',
      buyerId: 'buyer_1',
      listingId: 'listing_1',
      listing: {
        userId: 'owner_1',
      },
      dispute: {
        id: 'dispute_1',
      },
    });

    await expect(
      service.createDispute('buyer_1', {
        evidence: [],
        reason: 'Duplicate dispute',
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects dispute creation for non-participants', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.unlock.findUnique.mockResolvedValue({
      id: 'unlock_1',
      buyerId: 'buyer_1',
      listingId: 'listing_1',
      listing: {
        userId: 'owner_1',
      },
      dispute: null,
    });

    await expect(
      service.createDispute('intruder_1', {
        evidence: [],
        reason: 'Unauthorized',
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects investigate transitions for non-open disputes', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.dispute.findUnique.mockResolvedValue({
      id: 'dispute_1',
      status: DisputeStatus.CLOSED,
    });

    await expect(
      service.investigateDispute('admin_1', 'dispute_1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects resolve transitions for non-open disputes', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.dispute.findUnique.mockResolvedValue({
      id: 'dispute_1',
      unlockId: 'unlock_1',
      status: DisputeStatus.RESOLVED,
      unlock: {
        id: 'unlock_1',
        isRefunded: false,
        confirmations: [],
      },
    });

    await expect(
      service.resolveDispute('admin_1', 'dispute_1', {
        action: 'NO_REFUND',
        resolution: 'Already handled',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects close transitions for disputes that are not resolved', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.dispute.findUnique.mockResolvedValue({
      id: 'dispute_1',
      status: DisputeStatus.OPEN,
    });

    await expect(
      service.closeDispute('admin_1', 'dispute_1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects dispute lookup for users who are not participants or admins', async () => {
    const { prismaService, service } = createDisputeService();

    prismaService.dispute.findUnique.mockResolvedValue({
      id: 'dispute_1',
      unlockId: 'unlock_1',
      reportedBy: 'buyer_1',
      reason: 'Mismatch',
      evidence: [],
      status: DisputeStatus.OPEN,
      resolution: null,
      createdAt: new Date('2026-03-20T09:00:00.000Z'),
      resolvedAt: null,
      unlock: {
        buyerId: 'buyer_1',
        creditsSpent: 0,
        isRefunded: false,
        listing: {
          userId: 'owner_1',
        },
      },
    });

    await expect(
      service.getDispute('intruder_1', Role.USER, 'dispute_1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

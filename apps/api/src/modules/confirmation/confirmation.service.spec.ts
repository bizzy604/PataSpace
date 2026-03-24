import {
  ConfirmationSide as PrismaConfirmationSide,
  DisputeStatus,
} from '@prisma/client';
import { ConfirmationService } from './confirmation.service';

describe('ConfirmationService', () => {
  const createConfirmationService = () => {
    const prismaService = {
      confirmation: {
        create: jest.fn(),
      },
      commission: {
        upsert: jest.fn(),
      },
      unlock: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const smsService = {
      sendMessage: jest.fn(),
    };
    const userService = {
      decryptPhoneNumber: jest.fn((value: string) =>
        value === 'buyer-phone' ? '+254700000001' : '+254700000002',
      ),
    };

    return {
      prismaService,
      smsService,
      userService,
      service: new ConfirmationService(
        prismaService as never,
        smsService as never,
        userService as never,
      ),
    };
  };

  it('auto-confirms stale one-sided unlocks and creates commission eligibility', async () => {
    const { prismaService, service, smsService } = createConfirmationService();

    prismaService.unlock.findMany.mockResolvedValue([
      {
        id: 'unlock_1',
        buyerId: 'buyer_1',
        isRefunded: false,
        refundReason: null,
        refundedAt: null,
        listing: {
          userId: 'owner_1',
          neighborhood: 'Kilimani',
          commission: 750,
          user: {
            phoneNumberEncrypted: 'owner-phone',
          },
        },
        buyer: {
          phoneNumberEncrypted: 'buyer-phone',
        },
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-01T10:00:00.000Z'),
          },
        ],
        dispute: null,
      },
    ]);
    prismaService.confirmation.create.mockResolvedValue({
      id: 'confirmation_2',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });
    prismaService.unlock.findUnique.mockResolvedValue({
      id: 'unlock_1',
      isRefunded: false,
      listing: {
        userId: 'owner_1',
        commission: 750,
      },
      confirmations: [
        {
          side: PrismaConfirmationSide.INCOMING_TENANT,
          confirmedAt: new Date('2026-03-01T10:00:00.000Z'),
        },
        {
          side: PrismaConfirmationSide.OUTGOING_TENANT,
          confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
        },
      ],
      dispute: null,
    });
    prismaService.commission.upsert.mockResolvedValue({
      amountKES: 750,
      status: 'PENDING',
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
    });
    smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });

    await expect(
      service.autoConfirmStaleUnlocks(new Date('2026-03-24T12:00:00.000Z')),
    ).resolves.toBe(1);
    expect(prismaService.confirmation.create).toHaveBeenCalledWith({
      data: {
        side: PrismaConfirmationSide.OUTGOING_TENANT,
        unlockId: 'unlock_1',
        userId: 'owner_1',
      },
      select: {
        confirmedAt: true,
        id: true,
        side: true,
        unlockId: true,
      },
    });
    expect(prismaService.commission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          amountKES: 750,
          outgoingTenantId: 'owner_1',
        }),
        where: {
          unlockId: 'unlock_1',
        },
      }),
    );
    expect(smsService.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('skips stale auto-confirmation when a dispute is still open', async () => {
    const { prismaService, service, smsService } = createConfirmationService();

    prismaService.unlock.findMany.mockResolvedValue([
      {
        id: 'unlock_1',
        buyerId: 'buyer_1',
        isRefunded: false,
        refundReason: null,
        refundedAt: null,
        listing: {
          userId: 'owner_1',
          neighborhood: 'Kilimani',
          commission: 750,
          user: {
            phoneNumberEncrypted: 'owner-phone',
          },
        },
        buyer: {
          phoneNumberEncrypted: 'buyer-phone',
        },
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-01T10:00:00.000Z'),
          },
        ],
        dispute: {
          status: DisputeStatus.OPEN,
        },
      },
    ]);

    await expect(
      service.autoConfirmStaleUnlocks(new Date('2026-03-24T12:00:00.000Z')),
    ).resolves.toBe(0);
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
    expect(prismaService.commission.upsert).not.toHaveBeenCalled();
    expect(smsService.sendMessage).not.toHaveBeenCalled();
  });
});

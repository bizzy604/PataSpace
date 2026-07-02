/**
 * Purpose: Gate tests for who may confirm which side of an unlock — the
 *   incoming tenant (buyer) owns INCOMING_TENANT, the listing owner owns
 *   OUTGOING_TENANT, and nobody can cross sides or confirm blocked unlocks.
 * Why important: Confirmations drive commission payouts. A side crossover
 *   (e.g. an incoming tenant recording the outgoing side) would let one party
 *   push an unlock into commission alone; these tests pin the server-side gate
 *   regardless of what any client UI shows.
 * Used by: jest runner via apps/api jest config.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import {
  ConfirmationSide as PrismaConfirmationSide,
  DisputeStatus,
} from '@prisma/client';
import { createConfirmationService, createUnlock } from './confirmation.spec-fixtures';

describe('ConfirmationService authorization', () => {
  const happyPathMocks = (mocks: ReturnType<typeof createConfirmationService>) => {
    mocks.prismaService.unlock.findUnique.mockResolvedValue(createUnlock());
    mocks.prismaService.confirmation.create.mockImplementation(
      ({ data }: { data: { unlockId: string; side: PrismaConfirmationSide } }) =>
        Promise.resolve({
          id: 'confirmation_1',
          unlockId: data.unlockId,
          side: data.side,
          confirmedAt: new Date('2026-03-24T10:00:00.000Z'),
        }),
    );
    mocks.prismaService.unlock.findUniqueOrThrow.mockResolvedValue({
      confirmations: [{ side: PrismaConfirmationSide.INCOMING_TENANT }],
      commission: null,
    });
    mocks.smsService.sendMessage.mockResolvedValue({
      accepted: true,
      messageId: 'sms_1',
      provider: 'sandbox',
    });
  };

  it('lets the buyer confirm only their own INCOMING side', async () => {
    const mocks = createConfirmationService();
    happyPathMocks(mocks);

    await expect(
      mocks.service.createConfirmation('buyer_1', {
        side: 'INCOMING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).resolves.toMatchObject({ side: PrismaConfirmationSide.INCOMING_TENANT });
    expect(mocks.prismaService.confirmation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { unlockId: 'unlock_1', userId: 'buyer_1', side: 'INCOMING_TENANT' },
      }),
    );
  });

  it('lets the listing owner confirm only their own OUTGOING side', async () => {
    const mocks = createConfirmationService();
    happyPathMocks(mocks);

    await expect(
      mocks.service.createConfirmation('owner_1', {
        side: 'OUTGOING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).resolves.toMatchObject({ side: PrismaConfirmationSide.OUTGOING_TENANT });
  });

  it('rejects the incoming tenant confirming the OUTGOING side', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(createUnlock());

    await expect(
      service.createConfirmation('buyer_1', {
        side: 'OUTGOING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
  });

  it('rejects the listing owner confirming the INCOMING side', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(createUnlock());

    await expect(
      service.createConfirmation('owner_1', {
        side: 'INCOMING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
  });

  it('rejects confirmations from users unrelated to the unlock', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(createUnlock());

    for (const side of ['INCOMING_TENANT', 'OUTGOING_TENANT']) {
      await expect(
        service.createConfirmation('intruder_1', {
          side: side as never,
          unlockId: 'unlock_1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate confirmations from the same side', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(
      createUnlock({
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-24T10:00:00.000Z'),
          },
        ],
      }),
    );

    await expect(
      service.createConfirmation('buyer_1', {
        side: 'INCOMING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
  });

  it('rejects confirmations for refunded unlocks', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(
      createUnlock({
        isRefunded: true,
        refundReason: 'Listing removed',
        refundedAt: new Date('2026-03-24T12:00:00.000Z'),
      }),
    );

    await expect(
      service.createConfirmation('buyer_1', {
        side: 'INCOMING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('blocks manual confirmations while a dispute is open', async () => {
    const { prismaService, service } = createConfirmationService();
    prismaService.unlock.findUnique.mockResolvedValue(
      createUnlock({
        dispute: {
          status: DisputeStatus.OPEN,
        },
      }),
    );

    await expect(
      service.createConfirmation('buyer_1', {
        side: 'INCOMING_TENANT' as never,
        unlockId: 'unlock_1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

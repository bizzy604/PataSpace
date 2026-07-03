/**
 * Purpose: Gate tests for the confirmation lifecycle — stale-unlock
 *   auto-confirmation, success-fee capture on full confirmation, and the
 *   mover-to-poster prompt (spec sections 4.4/4.6).
 * Why important: Auto-confirmation attributes the missing side after 14 days
 *   and triggers the money loop; a regression here pays or blocks real money.
 *   Side/authorization rules live in confirmation.authorization.spec.ts.
 * Used by: jest runner via apps/api jest config.
 */
import { ConfirmationSide as PrismaConfirmationSide, DisputeStatus } from '@prisma/client';
import { createConfirmationService, createUnlock } from './confirmation.spec-fixtures';

describe('ConfirmationService', () => {
  it('auto-confirms stale one-sided unlocks and triggers fee capture + commission', async () => {
    const { notifier, prismaService, proxySessionService, service, successFeeService } =
      createConfirmationService();
    const staleUnlock = createUnlock({
      confirmations: [
        {
          side: PrismaConfirmationSide.INCOMING_TENANT,
          confirmedAt: new Date('2026-03-01T10:00:00.000Z'),
        },
      ],
    });

    prismaService.unlock.findMany.mockResolvedValue([staleUnlock]);
    prismaService.confirmation.create.mockResolvedValue({
      id: 'confirmation_2',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });
    prismaService.unlock.findUnique.mockResolvedValue(
      createUnlock({
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
      }),
    );
    prismaService.commission.findUnique.mockResolvedValue({
      amountKES: 210,
      status: 'PENDING',
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
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
    expect(successFeeService.ensureForConfirmedUnlock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'unlock_1',
        buyerId: 'buyer_1',
        creditsSpent: 300,
      }),
    );
    expect(proxySessionService.extendForConfirmedUnlock).toHaveBeenCalledWith('unlock_1');
    expect(notifier.sendConfirmationNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'unlock_1' }),
      'OUTGOING_TENANT',
      expect.objectContaining({ amountKES: 210 }),
    );
  });

  it('skips stale auto-confirmation when a dispute is still open', async () => {
    const { notifier, prismaService, service, successFeeService } = createConfirmationService();

    prismaService.unlock.findMany.mockResolvedValue([
      createUnlock({
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-01T10:00:00.000Z'),
          },
        ],
        dispute: {
          status: DisputeStatus.OPEN,
        },
      }),
    ]);

    await expect(
      service.autoConfirmStaleUnlocks(new Date('2026-03-24T12:00:00.000Z')),
    ).resolves.toBe(0);
    expect(prismaService.confirmation.create).not.toHaveBeenCalled();
    expect(successFeeService.ensureForConfirmedUnlock).not.toHaveBeenCalled();
    expect(notifier.sendConfirmationNotifications).not.toHaveBeenCalled();
  });

  it('returns the success fee and settles nothing extra when both sides confirm', async () => {
    const { prismaService, service, successFeeService } = createConfirmationService();
    const unlockBeforeConfirm = createUnlock({
      confirmations: [
        {
          side: PrismaConfirmationSide.INCOMING_TENANT,
          confirmedAt: new Date('2026-03-20T10:00:00.000Z'),
        },
      ],
    });
    const unlockAfterConfirm = createUnlock({
      confirmations: [
        {
          side: PrismaConfirmationSide.INCOMING_TENANT,
          confirmedAt: new Date('2026-03-20T10:00:00.000Z'),
        },
        {
          side: PrismaConfirmationSide.OUTGOING_TENANT,
          confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
        },
      ],
    });

    prismaService.unlock.findUnique
      .mockResolvedValueOnce(unlockBeforeConfirm)
      .mockResolvedValueOnce(unlockAfterConfirm);
    prismaService.confirmation.create.mockResolvedValue({
      id: 'confirmation_2',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });
    prismaService.commission.findUnique.mockResolvedValue({
      amountKES: 210,
      status: 'PENDING',
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
    });

    const result = await service.createConfirmation('owner_1', {
      side: 'OUTGOING_TENANT' as never,
      unlockId: 'unlock_1',
    });

    expect(result.bothConfirmed).toBe(true);
    expect(result.successFee).toMatchObject({
      feeDueKes: 2500,
      creditsApplied: 300,
      remainingKes: 2200,
      status: 'PARTIAL',
    });
    expect(result.commission).toMatchObject({ amount: 210 });
    expect(result.vacatedListingPrompt).toBeUndefined();
    expect(successFeeService.ensureForConfirmedUnlock).toHaveBeenCalledTimes(1);
  });

  it('hands the mover the vacated-listing prompt when they confirm', async () => {
    const { prismaService, service } = createConfirmationService();

    prismaService.unlock.findUnique.mockResolvedValue(createUnlock());
    prismaService.confirmation.create.mockResolvedValue({
      id: 'confirmation_1',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.INCOMING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });

    const result = await service.createConfirmation('buyer_1', {
      side: 'INCOMING_TENANT' as never,
      unlockId: 'unlock_1',
    });

    // Estimate: 70% of clamp(10% x 25,000) = 70% of 2,500 = 1,750.
    expect(result.vacatedListingPrompt).toMatchObject({
      seededFromConfirmationId: 'confirmation_1',
      estimatedEarningsKes: 1750,
    });
    expect(result.vacatedListingPrompt?.message).toContain('1750');
  });
});

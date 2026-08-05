/**
 * Purpose: Gate tests for the manual confirmation path — the settlement
 *   delegation, the response shape the mobile client renders, and the
 *   mover-to-poster prompt (spec sections 4.4/4.6).
 * Why important: this is the tenant-facing half of the payout trigger.
 *   Auto-confirmation lives in application/stale-confirmation.service.spec.ts,
 *   the lock in application/settlement.service.spec.ts, and side/authorization
 *   rules in confirmation.authorization.spec.ts.
 * Used by: jest runner via apps/api jest config.
 */
import { ConfirmationSide as PrismaConfirmationSide } from '@prisma/client';
import {
  createConfirmationService,
  createSettlementOutcome,
  createUnlock,
} from './confirmation.spec-fixtures';

describe('ConfirmationService', () => {
  it('returns the success fee and commission when both sides confirm', async () => {
    const { repository, service, settlementService } = createConfirmationService();

    repository.findUnlock.mockResolvedValue(
      createUnlock({
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-20T10:00:00.000Z'),
          },
        ],
      }),
    );
    repository.createConfirmation.mockResolvedValue({
      id: 'confirmation_2',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });
    settlementService.ensureSettlementIfEligible.mockResolvedValue(createSettlementOutcome());

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
    expect(settlementService.ensureSettlementIfEligible).toHaveBeenCalledWith('unlock_1');
  });

  // A one-sided confirmation must not advertise a payout. Settlement returning
  // null is the signal, and bothConfirmed drives the whole client-side state.
  it('reports a pending state when only one side has confirmed', async () => {
    const { repository, service } = createConfirmationService();

    repository.findUnlock.mockResolvedValue(createUnlock());
    repository.createConfirmation.mockResolvedValue({
      id: 'confirmation_1',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });

    const result = await service.createConfirmation('owner_1', {
      side: 'OUTGOING_TENANT' as never,
      unlockId: 'unlock_1',
    });

    expect(result.bothConfirmed).toBe(false);
    expect(result.commission).toBeUndefined();
    expect(result.successFee).toBeUndefined();
    expect(result.message).toContain('Waiting for incoming tenant');
  });

  it('hands the mover the vacated-listing prompt when they confirm', async () => {
    const { repository, service } = createConfirmationService();

    repository.findUnlock.mockResolvedValue(createUnlock());
    repository.createConfirmation.mockResolvedValue({
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

  it('surfaces the commission date to the confirming party', async () => {
    const { repository, service, settlementService } = createConfirmationService();

    repository.findUnlock.mockResolvedValue(
      createUnlock({
        confirmations: [
          {
            side: PrismaConfirmationSide.INCOMING_TENANT,
            confirmedAt: new Date('2026-03-20T10:00:00.000Z'),
          },
        ],
      }),
    );
    repository.createConfirmation.mockResolvedValue({
      id: 'confirmation_2',
      unlockId: 'unlock_1',
      side: PrismaConfirmationSide.OUTGOING_TENANT,
      confirmedAt: new Date('2026-03-24T09:00:00.000Z'),
    });
    settlementService.ensureSettlementIfEligible.mockResolvedValue(createSettlementOutcome());

    const result = await service.createConfirmation('owner_1', {
      side: 'OUTGOING_TENANT' as never,
      unlockId: 'unlock_1',
    });

    expect(result.message).toContain('2026-03-31');
  });
});

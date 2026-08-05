/**
 * Purpose: Gate tests for the 14-day auto-confirmation sweep — side
 *   attribution, the one-sided and dispute filters, the concurrent-confirmation
 *   race, and the fact that an auto-confirmed handover settles like a manual one.
 * Why important: this job acts on a tenant's behalf without them asking. Wrong
 *   side attribution confirms a handover the wrong party never agreed to, and a
 *   missed dispute filter pays out on a deal an admin is still reversing.
 * Used by: jest runner via apps/api jest config.
 */
import { BadRequestException } from '@nestjs/common';
import { ConfirmationSide as PrismaConfirmationSide, DisputeStatus, Prisma } from '@prisma/client';
import {
  createSettlementOutcome,
  createStaleConfirmationHarness,
  createUnlock,
} from '../confirmation.spec-fixtures';

const INCOMING_CONFIRMED_AT = new Date('2026-03-01T10:00:00.000Z');
const NOW = new Date('2026-03-24T12:00:00.000Z');

const oneSidedUnlock = (side: PrismaConfirmationSide, overrides = {}) =>
  createUnlock({
    confirmations: [{ side, confirmedAt: INCOMING_CONFIRMED_AT }],
    ...overrides,
  });

describe('StaleConfirmationService', () => {
  it('auto-confirms stale one-sided unlocks and settles them', async () => {
    const { notifier, repository, service, settlementService } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT),
    ]);
    settlementService.ensureSettlementIfEligible.mockResolvedValue(createSettlementOutcome());

    await expect(service.autoConfirmStaleUnlocks(NOW)).resolves.toBe(1);
    // The buyer already confirmed, so the missing side is the owner's, and it
    // must be attributed to the owner, not the buyer.
    expect(repository.createConfirmation).toHaveBeenCalledWith(
      'unlock_1',
      'owner_1',
      'OUTGOING_TENANT',
    );
    expect(settlementService.ensureSettlementIfEligible).toHaveBeenCalledWith('unlock_1');
    expect(notifier.sendConfirmationNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'unlock_1' }),
      'OUTGOING_TENANT',
      expect.objectContaining({ amountKES: 210 }),
    );
  });

  // Settlement is what locks the listing, so this proves the 14-day path takes
  // the house off the market exactly like a manual both-sides confirmation.
  it('routes auto-confirmations through settlement so the listing is handed over', async () => {
    const { repository, service, settlementService } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT),
    ]);
    settlementService.ensureSettlementIfEligible.mockResolvedValue(createSettlementOutcome());

    await service.autoConfirmStaleUnlocks(NOW);

    expect(settlementService.ensureSettlementIfEligible).toHaveBeenCalledTimes(1);
  });

  it('attributes the buyer when the owner is the side that already confirmed', async () => {
    const { repository, service } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.OUTGOING_TENANT),
    ]);

    await service.autoConfirmStaleUnlocks(NOW);

    expect(repository.createConfirmation).toHaveBeenCalledWith(
      'unlock_1',
      'buyer_1',
      'INCOMING_TENANT',
    );
  });

  it('skips stale auto-confirmation when a dispute is still open', async () => {
    const { notifier, repository, service, settlementService } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT, {
        dispute: { status: DisputeStatus.OPEN },
      }),
    ]);

    await expect(service.autoConfirmStaleUnlocks(NOW)).resolves.toBe(0);
    expect(repository.createConfirmation).not.toHaveBeenCalled();
    expect(settlementService.ensureSettlementIfEligible).not.toHaveBeenCalled();
    expect(notifier.sendConfirmationNotifications).not.toHaveBeenCalled();
  });

  // The candidate query cannot express "exactly one confirmation", so a fully
  // confirmed unlock reaches this loop and the policy has to reject it.
  it('skips unlocks that already have both sides', async () => {
    const { repository, service } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      createUnlock({
        confirmations: [
          { side: PrismaConfirmationSide.INCOMING_TENANT, confirmedAt: INCOMING_CONFIRMED_AT },
          { side: PrismaConfirmationSide.OUTGOING_TENANT, confirmedAt: INCOMING_CONFIRMED_AT },
        ],
      }),
    ]);

    await expect(service.autoConfirmStaleUnlocks(NOW)).resolves.toBe(0);
    expect(repository.createConfirmation).not.toHaveBeenCalled();
  });

  it('scans from a cutoff 14 days before now', async () => {
    const { repository, service } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([]);

    await service.autoConfirmStaleUnlocks(NOW);

    expect(repository.findStaleUnlockCandidates).toHaveBeenCalledWith(
      new Date('2026-03-10T12:00:00.000Z'),
    );
  });

  // The real counterparty confirmed between the scan and the write. The winning
  // request already settled it, so this one skips rather than aborting the sweep.
  it('skips a unlock the counterparty confirmed mid-sweep and keeps going', async () => {
    const { repository, service, settlementService } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT),
      createUnlock({
        id: 'unlock_2',
        confirmations: [
          { side: PrismaConfirmationSide.INCOMING_TENANT, confirmedAt: INCOMING_CONFIRMED_AT },
        ],
      }),
    ]);
    repository.createConfirmation.mockImplementationOnce(() => {
      throw new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      });
    });

    await expect(service.autoConfirmStaleUnlocks(NOW)).resolves.toBe(1);
    expect(settlementService.ensureSettlementIfEligible).toHaveBeenCalledTimes(1);
    expect(settlementService.ensureSettlementIfEligible).toHaveBeenCalledWith('unlock_2');
  });

  it('skips an ALREADY_CONFIRMED rejection without failing the sweep', async () => {
    const { repository, service } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT),
    ]);
    repository.createConfirmation.mockRejectedValue(
      new BadRequestException({ code: 'ALREADY_CONFIRMED' }),
    );

    await expect(service.autoConfirmStaleUnlocks(NOW)).resolves.toBe(0);
  });

  // An unexpected failure is not a skip. Swallowing it would let the sweep
  // report success while silently confirming nothing, night after night.
  it('propagates an unexpected write failure', async () => {
    const { repository, service } = createStaleConfirmationHarness();

    repository.findStaleUnlockCandidates.mockResolvedValue([
      oneSidedUnlock(PrismaConfirmationSide.INCOMING_TENANT),
    ]);
    repository.createConfirmation.mockRejectedValue(new Error('connection lost'));

    await expect(service.autoConfirmStaleUnlocks(NOW)).rejects.toThrow('connection lost');
  });
});

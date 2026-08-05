/**
 * Purpose: Gate tests for the settlement step — the both-sides-confirmed
 *   trigger, the listing handover wire-in, and every condition that must block
 *   settlement (one-sided, refunded, live dispute, missing unlock).
 * Why important: this is the only place a listing gets locked. If settlement
 *   fires without the handover, rival tenants keep paying for a taken house; if
 *   it fires on a disputed unlock, an admin's reversal comes too late.
 * Used by: jest runner via apps/api jest config.
 */
import { DisputeStatus } from '@prisma/client';
import { createSettlementHarness, createUnlock } from '../confirmation.spec-fixtures';

const bothSidesConfirmed = () =>
  createUnlock({
    confirmations: [
      { confirmedAt: new Date('2026-03-20T10:00:00.000Z') },
      { confirmedAt: new Date('2026-03-24T09:00:00.000Z') },
    ],
  });

describe('SettlementService', () => {
  it('captures the fee, extends contact, and hands the listing over when both sides confirm', async () => {
    const {
      listingHandoverService,
      proxySessionService,
      repository,
      service,
      successFeeService,
    } = createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(bothSidesConfirmed());
    repository.findCommission.mockResolvedValue({
      amountKES: 210,
      status: 'PENDING',
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
    });

    const result = await service.ensureSettlementIfEligible('unlock_1');

    expect(successFeeService.ensureForConfirmedUnlock).toHaveBeenCalledTimes(1);
    expect(proxySessionService.extendForConfirmedUnlock).toHaveBeenCalledWith('unlock_1');
    // The listing id, then the winning unlock id. Reversing these would refund
    // the winner and leave the rivals paid-up on a dead listing.
    expect(listingHandoverService.handOverListing).toHaveBeenCalledWith('listing_1', 'unlock_1');
    expect(result?.commission).toMatchObject({ amountKES: 210 });
  });

  // One confirmation means only one party says the handover happened. Locking
  // on that alone would take a live listing off the market on one person's say-so.
  it('does not settle or lock on a one-sided confirmation', async () => {
    const { listingHandoverService, repository, service, successFeeService } =
      createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(
      createUnlock({
        confirmations: [{ confirmedAt: new Date('2026-03-20T10:00:00.000Z') }],
      }),
    );

    await expect(service.ensureSettlementIfEligible('unlock_1')).resolves.toBeNull();
    expect(successFeeService.ensureForConfirmedUnlock).not.toHaveBeenCalled();
    expect(listingHandoverService.handOverListing).not.toHaveBeenCalled();
  });

  it('does not settle or lock while a dispute is open', async () => {
    const { listingHandoverService, repository, service, successFeeService } =
      createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(
      createUnlock({
        confirmations: [
          { confirmedAt: new Date('2026-03-20T10:00:00.000Z') },
          { confirmedAt: new Date('2026-03-24T09:00:00.000Z') },
        ],
        dispute: { status: DisputeStatus.OPEN },
      }),
    );

    await expect(service.ensureSettlementIfEligible('unlock_1')).resolves.toBeNull();
    expect(successFeeService.ensureForConfirmedUnlock).not.toHaveBeenCalled();
    expect(listingHandoverService.handOverListing).not.toHaveBeenCalled();
  });

  // A refunded unlock is already unwound. Locking the listing for it would take
  // a house off the market for a tenant who has their credits back.
  it('does not settle or lock a refunded unlock', async () => {
    const { listingHandoverService, repository, service } = createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(
      createUnlock({
        isRefunded: true,
        confirmations: [
          { confirmedAt: new Date('2026-03-20T10:00:00.000Z') },
          { confirmedAt: new Date('2026-03-24T09:00:00.000Z') },
        ],
      }),
    );

    await expect(service.ensureSettlementIfEligible('unlock_1')).resolves.toBeNull();
    expect(listingHandoverService.handOverListing).not.toHaveBeenCalled();
  });

  it('returns null when the unlock is gone', async () => {
    const { listingHandoverService, repository, service } = createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(null);

    await expect(service.ensureSettlementIfEligible('unlock_1')).resolves.toBeNull();
    expect(listingHandoverService.handOverListing).not.toHaveBeenCalled();
  });

  // The handover is idempotent and returns false on a repeat, but settlement
  // still has to report the commission: the caller renders it to the tenant.
  it('still reports the commission when the listing was already handed over', async () => {
    const { listingHandoverService, repository, service } = createSettlementHarness();

    repository.findUnlockForSettlement.mockResolvedValue(bothSidesConfirmed());
    repository.findCommission.mockResolvedValue({
      amountKES: 210,
      status: 'PENDING',
      eligibleAt: new Date('2026-03-31T09:00:00.000Z'),
    });
    listingHandoverService.handOverListing.mockResolvedValue(false);

    const result = await service.ensureSettlementIfEligible('unlock_1');

    expect(result?.commission).toMatchObject({ amountKES: 210 });
  });
});

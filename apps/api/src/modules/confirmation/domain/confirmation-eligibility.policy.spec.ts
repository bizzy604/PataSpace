/**
 * Purpose: Gate tests for the pure confirmation rules — the settlement gate,
 * the blocking dispute set, the one-sided auto-confirm filter, side attribution,
 * and the 14-day cutoff.
 * Why important: these predicates decide when money moves and when a listing
 * leaves the market. Testing them without a database means the money rules stay
 * pinned even as the services around them are refactored.
 * Used by: jest runner via apps/api jest config.
 */
import { ConfirmationSide as PrismaConfirmationSide, DisputeStatus } from '@prisma/client';
import {
  AUTO_CONFIRM_AFTER_DAYS,
  hasBlockingDispute,
  isAutoConfirmable,
  isSettleable,
  missingConfirmationSide,
  staleConfirmationCutoff,
} from './confirmation-eligibility.policy';

const confirmations = (count: number) => Array.from({ length: count }, () => ({}));

describe('confirmation eligibility policy', () => {
  describe('isSettleable', () => {
    it('settles when both sides confirmed and nothing blocks', () => {
      expect(
        isSettleable({ isRefunded: false, confirmations: confirmations(2), dispute: null }),
      ).toBe(true);
    });

    it.each([0, 1])('refuses %i confirmations', (count) => {
      expect(
        isSettleable({ isRefunded: false, confirmations: confirmations(count), dispute: null }),
      ).toBe(false);
    });

    it('refuses a refunded unlock even with both sides confirmed', () => {
      expect(
        isSettleable({ isRefunded: true, confirmations: confirmations(2), dispute: null }),
      ).toBe(false);
    });

    it('refuses a missing unlock', () => {
      expect(isSettleable(null)).toBe(false);
    });

    it.each([DisputeStatus.OPEN, DisputeStatus.INVESTIGATING])(
      'refuses while a dispute is %s',
      (status) => {
        expect(
          isSettleable({ isRefunded: false, confirmations: confirmations(2), dispute: { status } }),
        ).toBe(false);
      },
    );

    // A closed dispute has already been adjudicated, so it must not block the
    // payout forever.
    it.each([DisputeStatus.RESOLVED, DisputeStatus.CLOSED])(
      'settles once a dispute is %s',
      (status) => {
        expect(
          isSettleable({ isRefunded: false, confirmations: confirmations(2), dispute: { status } }),
        ).toBe(true);
      },
    );
  });

  describe('hasBlockingDispute', () => {
    it('treats a missing dispute as clear', () => {
      expect(hasBlockingDispute(null)).toBe(false);
    });

    it.each([DisputeStatus.OPEN, DisputeStatus.INVESTIGATING])('blocks on %s', (status) => {
      expect(hasBlockingDispute({ status })).toBe(true);
    });
  });

  describe('isAutoConfirmable', () => {
    it('auto-confirms a strictly one-sided unlock', () => {
      expect(
        isAutoConfirmable({
          confirmations: [{ side: PrismaConfirmationSide.INCOMING_TENANT }],
          dispute: null,
        }),
      ).toBe(true);
    });

    // Zero means nobody claims the handover happened; two means it is already
    // settled. Neither may be auto-confirmed on a tenant's behalf.
    it('refuses an unlock with no confirmations', () => {
      expect(isAutoConfirmable({ confirmations: [], dispute: null })).toBe(false);
    });

    it('refuses an unlock that already has both sides', () => {
      expect(
        isAutoConfirmable({
          confirmations: [
            { side: PrismaConfirmationSide.INCOMING_TENANT },
            { side: PrismaConfirmationSide.OUTGOING_TENANT },
          ],
          dispute: null,
        }),
      ).toBe(false);
    });

    it('refuses while a dispute is open', () => {
      expect(
        isAutoConfirmable({
          confirmations: [{ side: PrismaConfirmationSide.INCOMING_TENANT }],
          dispute: { status: DisputeStatus.OPEN },
        }),
      ).toBe(false);
    });
  });

  describe('missingConfirmationSide', () => {
    it('returns the outgoing side when the incoming tenant confirmed', () => {
      expect(missingConfirmationSide(PrismaConfirmationSide.INCOMING_TENANT)).toBe(
        'OUTGOING_TENANT',
      );
    });

    it('returns the incoming side when the outgoing tenant confirmed', () => {
      expect(missingConfirmationSide(PrismaConfirmationSide.OUTGOING_TENANT)).toBe(
        'INCOMING_TENANT',
      );
    });
  });

  describe('staleConfirmationCutoff', () => {
    it('is exactly 14 days back', () => {
      expect(AUTO_CONFIRM_AFTER_DAYS).toBe(14);
      expect(staleConfirmationCutoff(new Date('2026-03-24T12:00:00.000Z'))).toEqual(
        new Date('2026-03-10T12:00:00.000Z'),
      );
    });
  });
});

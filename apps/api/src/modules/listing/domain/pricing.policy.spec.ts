/**
 * Purpose: Gate tests for the two-part pricing policy (spec v1.1 section 4.3),
 * including the spec's worked examples.
 * Why important: pricing mistakes reprice liabilities; these tests pin the
 * bands, the clamp, and the 70/30 split exactly.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { ListingHouseType } from '@prisma/client';
import {
  computeSuccessFeeKes,
  posterShareKes,
  resolveUnlockCredits,
} from './pricing.policy';

describe('pricing.policy', () => {
  describe('resolveUnlockCredits', () => {
    it.each([
      [ListingHouseType.STUDIO, 100],
      [ListingHouseType.BEDSITTER, 100],
      [ListingHouseType.ONE_BEDROOM, 200],
      [ListingHouseType.TWO_BEDROOM, 300],
      [ListingHouseType.THREE_BEDROOM, 400],
      [ListingHouseType.FOUR_BEDROOM_PLUS, 500],
      [ListingHouseType.MANSION, 500],
    ])('bands %s at %d credits', (houseType, expected) => {
      expect(resolveUnlockCredits(houseType)).toBe(expected);
    });

    it('honors config overrides', () => {
      expect(
        resolveUnlockCredits(ListingHouseType.BEDSITTER, {
          unlockBandBedsitter: 150,
          unlockBand1Br: 200,
          unlockBand2Br: 300,
          unlockBand3Br: 400,
          unlockBand4BrPlus: 500,
          successFeePct: 0.1,
          feeFloorKes: 1000,
          feeCapKes: 5000,
          splitPoster: 0.7,
        }),
      ).toBe(150);
    });
  });

  describe('computeSuccessFeeKes (spec worked examples)', () => {
    it('applies the floor for a 7,000 KES bedsitter', () => {
      expect(computeSuccessFeeKes(7000)).toBe(1000);
    });

    it('takes 10% of a 25,000 KES 1BR', () => {
      expect(computeSuccessFeeKes(25000)).toBe(2500);
    });

    it('applies the cap for a 65,000 KES 2BR', () => {
      expect(computeSuccessFeeKes(65000)).toBe(5000);
    });

    it('sits exactly on the floor boundary at 10,000 KES rent', () => {
      expect(computeSuccessFeeKes(10000)).toBe(1000);
    });

    it('sits exactly on the cap boundary at 50,000 KES rent', () => {
      expect(computeSuccessFeeKes(50000)).toBe(5000);
    });
  });

  describe('posterShareKes (spec worked examples)', () => {
    it('pays the poster 700 on a floor fee', () => {
      expect(posterShareKes(1000)).toBe(700);
    });

    it('pays the poster 1,750 on a 2,500 fee', () => {
      expect(posterShareKes(2500)).toBe(1750);
    });

    it('pays the poster 3,500 on a capped fee', () => {
      expect(posterShareKes(5000)).toBe(3500);
    });

    it('pays 70% of a partial collection, rounded', () => {
      expect(posterShareKes(333)).toBe(233);
    });

    it('pays nothing when nothing is collected', () => {
      expect(posterShareKes(0)).toBe(0);
    });
  });
});

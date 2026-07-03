/**
 * Purpose: Two-part pricing policy (spec v1.1 section 4.3): flat unlock-credit
 * bands per unit type plus a success fee clamped between a floor and a cap,
 * split 70/30 between poster and platform.
 * Why important: the unlock fee is anti-spam working float, not revenue; the
 * success fee at move-in is the revenue engine. Snapshots taken from these
 * functions must never be recomputed for existing holds or pending fees.
 * Used by: ListingService (create/update snapshots), SuccessFeeService
 * (poster share of collected), ListingSeedService (earnings estimate).
 */
import { ListingHouseType } from '@prisma/client';

export type PricingConfig = {
  unlockBandBedsitter: number;
  unlockBand1Br: number;
  unlockBand2Br: number;
  unlockBand3Br: number;
  unlockBand4BrPlus: number;
  successFeePct: number;
  feeFloorKes: number;
  feeCapKes: number;
  splitPoster: number;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  unlockBandBedsitter: 100,
  unlockBand1Br: 200,
  unlockBand2Br: 300,
  unlockBand3Br: 400,
  unlockBand4BrPlus: 500,
  successFeePct: 0.1,
  feeFloorKes: 1000,
  feeCapKes: 5000,
  splitPoster: 0.7,
};

export function resolveUnlockCredits(
  houseType: ListingHouseType,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  switch (houseType) {
    case ListingHouseType.STUDIO:
    case ListingHouseType.BEDSITTER:
      return config.unlockBandBedsitter;
    case ListingHouseType.ONE_BEDROOM:
      return config.unlockBand1Br;
    case ListingHouseType.TWO_BEDROOM:
      return config.unlockBand2Br;
    case ListingHouseType.THREE_BEDROOM:
      return config.unlockBand3Br;
    case ListingHouseType.FOUR_BEDROOM_PLUS:
    case ListingHouseType.MANSION:
      return config.unlockBand4BrPlus;
  }
}

export function computeSuccessFeeKes(
  monthlyRent: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  const rawFee = Math.round(monthlyRent * config.successFeePct);

  return Math.min(Math.max(rawFee, config.feeFloorKes), config.feeCapKes);
}

export function posterShareKes(
  collectedKes: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  return Math.round(collectedKes * config.splitPoster);
}

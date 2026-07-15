/**
 * Purpose: The registry of admin-editable runtime config keys — their group,
 *   display metadata, kind, and bounds — plus pure parse/validate helpers.
 * Why important: Every editable knob is declared here once; the runtime
 *   resolver, the admin list, and per-key validation all read this so a new
 *   key cannot drift between them.
 * Used by: SystemConfigService, AdminConfigController validation.
 */
export type ConfigKind = 'int' | 'ratio';

export type ConfigGroup = 'PRICING' | 'INCENTIVES';

export type ConfigKeyDef = {
  key: string;
  group: ConfigGroup;
  label: string;
  description: string;
  unit: string;
  kind: ConfigKind;
  min: number;
  max: number;
};

// Keys map 1:1 onto PricingConfig fields (plus the referral reward). The
// resolver overlays any of these that exist in SystemConfig onto the env-based
// defaults, so an absent key means "use the deploy-time default".
export const CONFIG_REGISTRY: ConfigKeyDef[] = [
  { key: 'pricing.unlockBandBedsitter', group: 'PRICING', label: 'Unlock cost — bedsitter/studio', description: 'Credits to unlock a bedsitter or studio listing.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
  { key: 'pricing.unlockBand1Br', group: 'PRICING', label: 'Unlock cost — 1 bedroom', description: 'Credits to unlock a one-bedroom listing.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
  { key: 'pricing.unlockBand2Br', group: 'PRICING', label: 'Unlock cost — 2 bedroom', description: 'Credits to unlock a two-bedroom listing.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
  { key: 'pricing.unlockBand3Br', group: 'PRICING', label: 'Unlock cost — 3 bedroom', description: 'Credits to unlock a three-bedroom listing.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
  { key: 'pricing.unlockBand4BrPlus', group: 'PRICING', label: 'Unlock cost — 4 bedroom+/mansion', description: 'Credits to unlock a four-bedroom-plus or mansion listing.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
  { key: 'pricing.successFeePct', group: 'PRICING', label: 'Success fee', description: 'Fraction of monthly rent charged as the move-in success fee.', unit: 'ratio (0–1)', kind: 'ratio', min: 0, max: 1 },
  { key: 'pricing.feeFloorKes', group: 'PRICING', label: 'Success fee floor', description: 'Minimum success fee in KES after applying the percentage.', unit: 'KES', kind: 'int', min: 0, max: 1_000_000 },
  { key: 'pricing.feeCapKes', group: 'PRICING', label: 'Success fee cap', description: 'Maximum success fee in KES after applying the percentage.', unit: 'KES', kind: 'int', min: 0, max: 1_000_000 },
  { key: 'pricing.splitPoster', group: 'PRICING', label: 'Poster share of success fee', description: 'Fraction of the collected success fee paid to the poster (the rest is platform revenue).', unit: 'ratio (0–1)', kind: 'ratio', min: 0, max: 1 },
  { key: 'referral.rewardCredits', group: 'INCENTIVES', label: 'Referral reward', description: 'Credits granted for a rewarded referral.', unit: 'credits', kind: 'int', min: 0, max: 100_000 },
];

export const CONFIG_KEYS = CONFIG_REGISTRY.map((entry) => entry.key);

export function findConfigKey(key: string): ConfigKeyDef | undefined {
  return CONFIG_REGISTRY.find((entry) => entry.key === key);
}

/** Parses a stored/string value for a key. Returns null when it is not a
 *  finite number in range or not an integer where an integer is required. */
export function parseConfigValue(def: ConfigKeyDef, value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return null;
  if (def.kind === 'int' && !Number.isInteger(parsed)) return null;
  if (parsed < def.min || parsed > def.max) return null;
  return parsed;
}

/**
 * Purpose: Runtime system-config resolver and admin editor. Effective values
 *   are the deploy-time env defaults overlaid with any SystemConfig DB rows,
 *   cached in-process and invalidated on write.
 * Why important: This is the one place pricing becomes live-editable. With no
 *   DB rows the resolved config is byte-identical to the env defaults, so the
 *   admin screen is additive and fully reversible; edits only affect NEW
 *   pricing snapshots, never existing holds or fees.
 * Used by: ListingService, SuccessFeeService, SuccessFeeSettlementService,
 *   ListingSeedService (runtime), AdminConfigController (admin CRUD).
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AdminConfigEntry } from '@pataspace/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import {
  DEFAULT_PRICING_CONFIG,
  PricingConfig,
} from '../listing/domain/pricing.policy';
import { CONFIG_KEYS, CONFIG_REGISTRY, findConfigKey, parseConfigValue } from './config-registry';

const REFERRAL_REWARD_KEY = 'referral.rewardCredits';

@Injectable()
export class SystemConfigService {
  private readonly envPricing: PricingConfig;
  private readonly envReferralReward: number;
  private cache: Map<string, number> | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.envPricing = configService.get<PricingConfig>('pricing') ?? DEFAULT_PRICING_CONFIG;
    this.envReferralReward = configService.get<number>('referral.rewardCredits') ?? 500;
  }

  async resolvePricingConfig(): Promise<PricingConfig> {
    const overrides = await this.loadOverrides();
    const resolved: PricingConfig = { ...this.envPricing };
    for (const [key, value] of overrides) {
      if (key.startsWith('pricing.')) {
        (resolved as unknown as Record<string, number>)[key.slice('pricing.'.length)] = value;
      }
    }
    return resolved;
  }

  async getReferralRewardCredits(): Promise<number> {
    const overrides = await this.loadOverrides();
    return overrides.get(REFERRAL_REWARD_KEY) ?? this.envReferralReward;
  }

  private envDefault(key: string): number {
    if (key === REFERRAL_REWARD_KEY) return this.envReferralReward;
    const field = key.slice('pricing.'.length) as keyof PricingConfig;
    return this.envPricing[field];
  }

  private async loadOverrides(): Promise<Map<string, number>> {
    if (this.cache) return this.cache;
    const rows = await this.prismaService.systemConfig.findMany({
      where: { key: { in: CONFIG_KEYS } },
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      const def = findConfigKey(row.key);
      const parsed = def ? parseConfigValue(def, row.value) : null;
      if (parsed !== null) map.set(row.key, parsed);
    }
    this.cache = map;
    return map;
  }

  invalidate(): void {
    this.cache = null;
  }

  async list(): Promise<AdminConfigEntry[]> {
    const overrides = await this.loadOverrides();
    const rows = await this.prismaService.systemConfig.findMany({
      where: { key: { in: CONFIG_KEYS } },
      select: { key: true, updatedAt: true },
    });
    const updatedAt = new Map(rows.map((row) => [row.key, row.updatedAt]));

    return CONFIG_REGISTRY.map((def) => {
      const override = overrides.get(def.key);
      return {
        key: def.key,
        group: def.group,
        label: def.label,
        description: def.description,
        unit: def.unit,
        kind: def.kind,
        value: override ?? this.envDefault(def.key),
        source: override !== undefined ? 'override' : 'default',
        min: def.min,
        max: def.max,
        updatedAt:
          override !== undefined ? (updatedAt.get(def.key)?.toISOString() ?? null) : null,
      };
    });
  }

  async setValue(key: string, rawValue: number, adminId: string): Promise<AdminConfigEntry> {
    const def = findConfigKey(key);
    if (!def) {
      throw new BadRequestException(`Unknown config key: ${key}`);
    }
    const value = parseConfigValue(def, rawValue);
    if (value === null) {
      throw new BadRequestException(
        `Value for ${key} must be a ${def.kind === 'int' ? 'whole number' : 'ratio'} between ${def.min} and ${def.max}`,
      );
    }
    await this.assertFeeBandCoherent(key, value);

    const previous = (await this.loadOverrides()).get(key) ?? this.envDefault(key);
    await this.prismaService.$transaction(async (tx) => {
      await tx.systemConfig.upsert({
        where: { key },
        update: { value: String(value), description: def.label },
        create: { key, value: String(value), description: def.label },
      });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'config.updated',
          entityType: 'SystemConfig',
          entityId: key,
          oldValue: { value: previous } satisfies Prisma.InputJsonObject,
          newValue: { value } satisfies Prisma.InputJsonObject,
        },
      });
    });

    this.invalidate();
    return (await this.list()).find((entry) => entry.key === key)!;
  }

  // The success fee is clamped to [floor, cap]; a floor above the cap would
  // invert the clamp, so reject the edit that would cross them.
  private async assertFeeBandCoherent(key: string, value: number): Promise<void> {
    if (key !== 'pricing.feeFloorKes' && key !== 'pricing.feeCapKes') return;
    const pricing = await this.resolvePricingConfig();
    const floor = key === 'pricing.feeFloorKes' ? value : pricing.feeFloorKes;
    const cap = key === 'pricing.feeCapKes' ? value : pricing.feeCapKes;
    if (floor > cap) {
      throw new BadRequestException(
        `Success fee floor (${floor}) cannot exceed the cap (${cap})`,
      );
    }
  }
}

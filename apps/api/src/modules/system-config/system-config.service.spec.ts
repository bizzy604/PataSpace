/**
 * Purpose: Gate tests for SystemConfigService — the env-base + DB-override
 *   resolver, the admin list, and setValue (validation, audit, invalidation).
 * Why important: This proves the safety guarantee: with no override rows the
 *   resolved pricing equals the env defaults, and an override changes exactly
 *   the intended field.
 * Used by: jest runner via apps/api jest config.
 */
import { BadRequestException } from '@nestjs/common';
import { DEFAULT_PRICING_CONFIG } from '../listing/domain/pricing.policy';
import { SystemConfigService } from './system-config.service';

const ENV_PRICING = { ...DEFAULT_PRICING_CONFIG };

const createService = (rows: Array<{ key: string; value: string; updatedAt?: Date }> = []) => {
  const store = [...rows];
  const systemConfig = {
    findMany: jest.fn(async () =>
      store.map((r) => ({ ...r, updatedAt: r.updatedAt ?? new Date('2026-07-14T00:00:00.000Z') })),
    ),
    upsert: jest.fn(
      async ({ where, create }: { where: { key: string }; create: { value: string } }) => {
        const existing = store.find((r) => r.key === where.key);
        if (existing) existing.value = create.value;
        else store.push({ key: where.key, value: create.value });
      },
    ),
  };
  const auditLog = { create: jest.fn() };
  const tx = { systemConfig, auditLog };
  const prismaService = {
    systemConfig,
    auditLog,
    $transaction: jest.fn((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  const configService = {
    get: jest.fn((key: string) => (key === 'pricing' ? ENV_PRICING : key === 'referral.rewardCredits' ? 500 : undefined)),
  };
  return { prismaService, service: new SystemConfigService(prismaService as never, configService as never) };
};

describe('SystemConfigService', () => {
  it('resolves env defaults when there are no override rows', async () => {
    const { service } = createService();
    await expect(service.resolvePricingConfig()).resolves.toEqual(ENV_PRICING);
    await expect(service.getReferralRewardCredits()).resolves.toBe(500);
  });

  it('overlays a valid DB override onto the env base', async () => {
    const { service } = createService([{ key: 'pricing.unlockBand2Br', value: '777' }]);
    const pricing = await service.resolvePricingConfig();
    expect(pricing.unlockBand2Br).toBe(777);
    expect(pricing.unlockBand1Br).toBe(ENV_PRICING.unlockBand1Br);
  });

  it('ignores an out-of-range stored override (falls back to default)', async () => {
    const { service } = createService([{ key: 'pricing.successFeePct', value: '9' }]);
    const pricing = await service.resolvePricingConfig();
    expect(pricing.successFeePct).toBe(ENV_PRICING.successFeePct);
  });

  it('lists entries with source and value', async () => {
    const { service } = createService([{ key: 'pricing.splitPoster', value: '0.6' }]);
    const entries = await service.list();
    const split = entries.find((e) => e.key === 'pricing.splitPoster')!;
    const band = entries.find((e) => e.key === 'pricing.unlockBand2Br')!;
    expect(split).toMatchObject({ value: 0.6, source: 'override' });
    expect(band).toMatchObject({ value: ENV_PRICING.unlockBand2Br, source: 'default', updatedAt: null });
  });

  it('sets a value, audit-logs it, and returns the updated entry', async () => {
    const { prismaService, service } = createService();
    const entry = await service.setValue('pricing.unlockBand2Br', 500, 'admin_1');
    expect(entry).toMatchObject({ key: 'pricing.unlockBand2Br', value: 500, source: 'override' });
    expect(prismaService.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'config.updated', entityId: 'pricing.unlockBand2Br' }),
      }),
    );
  });

  it('rejects an unknown key', async () => {
    const { service } = createService();
    await expect(service.setValue('pricing.nope', 1, 'admin_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an out-of-range value', async () => {
    const { service } = createService();
    await expect(service.setValue('pricing.successFeePct', 5, 'admin_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a fee floor above the cap', async () => {
    const { service } = createService([{ key: 'pricing.feeCapKes', value: '2000' }]);
    await expect(service.setValue('pricing.feeFloorKes', 3000, 'admin_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

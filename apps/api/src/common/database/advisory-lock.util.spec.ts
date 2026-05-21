/**
 * Purpose: Unit tests for the advisory-lock helpers.
 * Why important: Guards the contract between job code and Postgres — we expect
 *   `pg_try_advisory_lock` to be called with the configured key and a boolean
 *   first-row return to be surfaced.
 * Used by: jest runner via apps/api jest config.
 */
import {
  ADVISORY_LOCK_KEYS,
  releaseAdvisoryLock,
  tryAdvisoryLock,
} from './advisory-lock.util';

describe('advisory-lock.util', () => {
  const buildPrisma = () => ({
    $queryRaw: jest.fn(),
  });

  it('exposes a stable key for the commission payout job', () => {
    expect(typeof ADVISORY_LOCK_KEYS.commissionPayoutJob).toBe('bigint');
  });

  it('returns true when pg_try_advisory_lock yields true', async () => {
    const prisma = buildPrisma();
    prisma.$queryRaw.mockResolvedValueOnce([{ pg_try_advisory_lock: true }]);

    const acquired = await tryAdvisoryLock(
      prisma as never,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    expect(acquired).toBe(true);
  });

  it('returns false when pg_try_advisory_lock yields false', async () => {
    const prisma = buildPrisma();
    prisma.$queryRaw.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

    const acquired = await tryAdvisoryLock(
      prisma as never,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    expect(acquired).toBe(false);
  });

  it('returns false when Postgres returns an empty result set', async () => {
    const prisma = buildPrisma();
    prisma.$queryRaw.mockResolvedValueOnce([]);

    const acquired = await tryAdvisoryLock(
      prisma as never,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    expect(acquired).toBe(false);
  });

  it('releases the lock and returns the Postgres scalar', async () => {
    const prisma = buildPrisma();
    prisma.$queryRaw.mockResolvedValueOnce([{ pg_advisory_unlock: true }]);

    const released = await releaseAdvisoryLock(
      prisma as never,
      ADVISORY_LOCK_KEYS.commissionPayoutJob,
    );

    expect(released).toBe(true);
  });
});

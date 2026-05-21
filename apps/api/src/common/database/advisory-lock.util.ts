/**
 * Purpose: Postgres session-scoped advisory-lock helpers.
 * Why important: Lets background jobs claim singleton execution across
 *   multiple API replicas — `pg_try_advisory_lock` is non-blocking, durable,
 *   and tied to the calling session so a crashing replica releases it.
 * Used by: jobs that must not run concurrently across replicas
 *   (commission payout, future single-leader workers).
 */
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Stable, hand-curated 64-bit keys for each named lock. Add a new entry
 * rather than reusing a value — Postgres bigints are signed so keep keys
 * well within 2^62 to leave headroom.
 */
export const ADVISORY_LOCK_KEYS = {
  commissionPayoutJob: 7261001n,
  referralRewardJob: 7261002n,
} as const;

async function readBooleanScalar(rows: Array<Record<string, unknown>>): Promise<boolean> {
  const first = rows[0];
  if (!first) return false;
  const value = Object.values(first)[0];
  return value === true;
}

/**
 * Attempt to take the advisory lock for the lifetime of the current session.
 * Returns true if the lock was acquired, false if another session already holds it.
 * Releases happen via {@link releaseAdvisoryLock} or automatically when the session ends.
 */
export async function tryAdvisoryLock(
  prisma: PrismaService,
  key: bigint,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>(
    Prisma.sql`SELECT pg_try_advisory_lock(${key}::bigint)`,
  );
  return readBooleanScalar(rows);
}

/**
 * Release a previously acquired advisory lock. Safe to call when the caller
 * is unsure whether the lock is still held — Postgres returns false rather
 * than raising.
 */
export async function releaseAdvisoryLock(
  prisma: PrismaService,
  key: bigint,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ pg_advisory_unlock: boolean }>>(
    Prisma.sql`SELECT pg_advisory_unlock(${key}::bigint)`,
  );
  return readBooleanScalar(rows);
}

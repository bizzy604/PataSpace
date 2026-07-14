/**
 * Purpose: Gate tests proving the single-flight refresh coordinator collapses
 *   concurrent callers into one underlying run and starts fresh afterward.
 * Why important: This is the mechanism stopping a stampede of
 *   POST /auth/refresh calls when several in-flight API requests 401 at the
 *   same moment (their access token just expired). If this regresses, a busy
 *   screen can burn multiple refresh-token rotations in one tick and race
 *   itself into a bad session.
 * Used by: apps/mobile test lane (pnpm --filter @pataspace/mobile test).
 */
import { createSingleFlight } from '../refresh-lock';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createSingleFlight', () => {
  it('collapses concurrent calls into exactly one underlying run', async () => {
    const gate = deferred<string>();
    const run = jest.fn(() => gate.promise);
    const singleFlight = createSingleFlight(run);

    const callA = singleFlight();
    const callB = singleFlight();
    const callC = singleFlight();

    expect(run).toHaveBeenCalledTimes(1);

    gate.resolve('refreshed-token');
    const [a, b, c] = await Promise.all([callA, callB, callC]);

    expect(a).toBe('refreshed-token');
    expect(b).toBe('refreshed-token');
    expect(c).toBe('refreshed-token');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh run after the previous one resolves', async () => {
    let calls = 0;
    const run = jest.fn(async () => {
      calls += 1;
      return `token-${calls}`;
    });
    const singleFlight = createSingleFlight(run);

    await expect(singleFlight()).resolves.toBe('token-1');
    await expect(singleFlight()).resolves.toBe('token-2');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('propagates a rejection to every concurrent caller and clears the lock', async () => {
    const gate = deferred<string>();
    const run = jest.fn(() => gate.promise);
    const singleFlight = createSingleFlight(run);

    const callA = singleFlight();
    const callB = singleFlight();

    gate.reject(new Error('refresh token revoked'));

    await expect(callA).rejects.toThrow('refresh token revoked');
    await expect(callB).rejects.toThrow('refresh token revoked');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh run after a rejection (not permanently locked)', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('token-after-retry');
    const singleFlight = createSingleFlight(run);

    await expect(singleFlight()).rejects.toThrow('boom');
    await expect(singleFlight()).resolves.toBe('token-after-retry');
    expect(run).toHaveBeenCalledTimes(2);
  });
});

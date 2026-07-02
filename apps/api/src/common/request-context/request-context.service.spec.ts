/**
 * Purpose: Unit tests for RequestContextService — AsyncLocalStorage scoping and the
 *   privileged runInternal helper used by background jobs.
 * Why important: runInternal is the only sanctioned way to obtain 'internal' DB access
 *   now that a missing context fails closed to 'anonymous'.
 * Used by: Jest test runner
 */

import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  it('returns undefined when no context is active', () => {
    const service = new RequestContextService();
    expect(service.get()).toBeUndefined();
  });

  it('runInternal establishes an internal access mode with a request id', () => {
    const service = new RequestContextService();

    const captured = service.runInternal(() => service.get());

    expect(captured?.databaseAccessMode).toBe('internal');
    expect(captured?.requestId).toEqual(expect.stringMatching(/^internal-/));
  });

  it('runInternal returns the callback result and does not leak the scope', () => {
    const service = new RequestContextService();

    const result = service.runInternal(() => 42);

    expect(result).toBe(42);
    expect(service.get()).toBeUndefined();
  });

  it('set is a no-op outside any context', () => {
    const service = new RequestContextService();
    expect(() => service.set({ userId: 'user_1' })).not.toThrow();
    expect(service.get()).toBeUndefined();
  });
});

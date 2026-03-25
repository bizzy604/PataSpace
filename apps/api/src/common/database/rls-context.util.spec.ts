import {
  buildRlsContext,
  resolveDatabaseAccessModeForPath,
  resolveDatabaseAccessModeForRole,
} from './rls-context.util';

describe('rls-context.util', () => {
  it('marks public auth and system routes as internal database access', () => {
    expect(resolveDatabaseAccessModeForPath('/api/v1/auth/register')).toBe('internal');
    expect(resolveDatabaseAccessModeForPath('/api/v1/auth/refresh')).toBe('internal');
    expect(resolveDatabaseAccessModeForPath('/api/v1/payments/mpesa-callback')).toBe('internal');
    expect(resolveDatabaseAccessModeForPath('/api/v1/health')).toBe('internal');
  });

  it('defaults regular routes to anonymous database access until auth is resolved', () => {
    expect(resolveDatabaseAccessModeForPath('/api/v1/listings')).toBe('anonymous');
    expect(resolveDatabaseAccessModeForPath('/api/v1/unlocks')).toBe('anonymous');
  });

  it('maps roles to user and admin database access modes', () => {
    expect(resolveDatabaseAccessModeForRole('USER')).toBe('user');
    expect(resolveDatabaseAccessModeForRole('ADMIN')).toBe('admin');
  });

  it('builds an internal fallback context when no request context exists', () => {
    expect(buildRlsContext()).toEqual({
      accessMode: 'internal',
      role: null,
      userId: null,
    });
  });

  it('builds a user-scoped RLS context from request state', () => {
    expect(
      buildRlsContext({
        databaseAccessMode: 'user',
        role: 'USER',
        userId: 'user_1',
      }),
    ).toEqual({
      accessMode: 'user',
      role: 'USER',
      userId: 'user_1',
    });
  });
});

import { Role } from '@prisma/client';
import type { RequestContextState } from '../request-context/request-context.service';

export type DatabaseAccessMode = 'anonymous' | 'user' | 'admin' | 'internal';

const INTERNAL_DATABASE_PATH_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/register',
  '/api/v1/auth/resend-otp',
  '/api/v1/auth/verify-otp',
] as const;

const INTERNAL_DATABASE_PATHS = new Set([
  '/api/v1/health',
  '/api/v1/payments/mpesa-callback',
  '/api/v1/ready',
]);

export type RlsContext = {
  accessMode: DatabaseAccessMode;
  role: string | null;
  userId: string | null;
};

export function resolveDatabaseAccessModeForPath(path?: string): DatabaseAccessMode {
  const normalizedPath = normalizePath(path);

  if (INTERNAL_DATABASE_PATHS.has(normalizedPath)) {
    return 'internal';
  }

  if (INTERNAL_DATABASE_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return 'internal';
  }

  return 'anonymous';
}

export function resolveDatabaseAccessModeForRole(role?: Role | string | null): DatabaseAccessMode {
  return role === Role.ADMIN || role === 'ADMIN' ? 'admin' : 'user';
}

export function buildRlsContext(state?: Pick<
  RequestContextState,
  'databaseAccessMode' | 'role' | 'userId'
> | null): RlsContext {
  if (!state) {
    return {
      accessMode: 'internal',
      role: null,
      userId: null,
    };
  }

  return {
    accessMode: state.databaseAccessMode ?? 'anonymous',
    role: state.role ?? null,
    userId: state.userId ?? null,
  };
}

function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  const [pathname] = path.split('?');
  return pathname.replace(/\/+$/, '') || '/';
}

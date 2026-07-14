/**
 * Purpose: Base API client for mobile — attaches the API's own JWT to every
 *   authenticated request, and silently refreshes + retries once on a 401.
 * Why important: Single place to add auth headers so screens don't embed
 *   fetch logic, and single place the 401-refresh-retry contract lives so
 *   every domain module gets it for free.
 * Used by: Domain API modules (listings, credits, unlocks) and
 *   features/auth/auth-provider.tsx (registers the token source).
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Registered once by features/auth/auth-provider.tsx on mount. Lets apiFetch
 * silently refresh and retry on a 401 without every call site (or every
 * lib/api/*.ts function) threading a refresh callback through by hand.
 * getAccessToken reads live state (a ref), so it never goes stale between
 * registration and the request that needs it. refreshAccessToken is expected
 * to already be single-flight (see lib/auth/refresh-lock.ts) — apiFetch does
 * not add its own coordination on top.
 */
export type AuthTokenSource = {
  getAccessToken: () => string | null;
  /** Resolves the new access token, or null if the session could not be refreshed. */
  refreshAccessToken: () => Promise<string | null>;
};

let authTokenSource: AuthTokenSource | null = null;

/** Called by the auth provider on mount/unmount. Pass null to clear (sign-out, unmount). */
export function setAuthTokenSource(source: AuthTokenSource | null): void {
  authTokenSource = source;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Zod validation errors arrive as details.fieldErrors; fold the first few
 * into the message so the user sees "photos: at least 5" instead of a bare
 * "Validation failed".
 */
function appendFieldErrors(message: string, details: unknown): string {
  if (!details || typeof details !== 'object') {
    return message;
  }

  const fieldErrors = (details as { fieldErrors?: Record<string, string[] | undefined> })
    .fieldErrors;

  if (!fieldErrors) {
    return message;
  }

  const parts = Object.entries(fieldErrors)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .slice(0, 3)
    .map(([field, messages]) => `${field}: ${messages![0]}`);

  return parts.length > 0 ? `${message}. ${parts.join('; ')}` : message;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Request failed: ${res.status}`;
    try {
      // API wraps errors as { error: { code, message, details }, meta: {...} }
      const body = (await res.json()) as {
        error?: { code?: string; message?: string; details?: unknown };
        code?: string;
        message?: string;
      };
      code = body.error?.code ?? body.code ?? code;
      message = body.error?.message ?? body.message ?? message;
      message = appendFieldErrors(message, body.error?.details);
    } catch {
      // ignore parse errors — keep the generic fallback
    }
    throw new ApiRequestError(res.status, code, message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/**
 * Authenticated fetch — getToken is supplied by the call site (every
 * lib/api/*.ts function takes it as a parameter, sourced from
 * features/auth/auth-provider.tsx's useAuthSession().getToken). On a 401,
 * apiFetch itself attempts one silent refresh via the registered
 * AuthTokenSource and retries the request once with the new token; if there
 * is no registered source, or the refresh fails, the 401 is thrown as
 * ApiRequestError like any other error response (the auth provider will
 * already have cleared the session on a failed refresh, so the app's
 * redirect effect sends the user back to login).
 */
export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
  _isRetryAfterRefresh = false,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && !_isRetryAfterRefresh && authTokenSource) {
    const refreshedToken = await authTokenSource.refreshAccessToken();
    if (refreshedToken) {
      return apiFetch<T>(path, async () => refreshedToken, init, true);
    }
  }

  return handleResponse<T>(res);
}

/** Unauthenticated fetch — for public endpoints (listing browse, auth entry points). */
export async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  return handleResponse<T>(res);
}

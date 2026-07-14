/**
 * Purpose: Server-only fetchers for the API's session endpoints (login,
 *   refresh, logout). Used exclusively by NextAuth's Credentials provider
 *   and its jwt callback, which run before any session/bearer token exists.
 * Why important: lib/api/client.ts's fetchers all assume a bearer token is
 *   being attached to an already-authenticated request; these three calls
 *   are how that token gets minted and rotated in the first place, so they
 *   bypass client.ts and talk to the API directly. Never import this module
 *   from a client component — it must stay server-only.
 * Used by: auth.ts (NextAuth configuration).
 */
import 'server-only';
import type {
  AuthSessionResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
} from '@pataspace/contracts';

// Prefer the internal docker-network URL for server-to-server calls (web and
// api are services on the same compose network — see infra/docker/docker-
// compose.vps.yml) to avoid a round trip through the public domain + nginx.
// Falls back to the public base for environments without a private network
// (local dev, preview deploys).
const API_INTERNAL_BASE =
  process.env.API_INTERNAL_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3000/api/v1';

const REQUEST_TIMEOUT_MS = 15_000;

export type AuthApiError = {
  code: string;
  message: string;
  statusCode: number;
};

/**
 * Thrown when the API responds with a non-2xx status. Carries the API's own
 * error code/message so callers (the Credentials provider) can surface the
 * real reason a login failed instead of a generic message.
 */
export class AuthApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function parseErrorBody(res: Response): Promise<AuthApiError> {
  let code = 'UNKNOWN_ERROR';
  let message = `Request failed: ${res.status}`;
  try {
    const body = (await res.json()) as Partial<AuthApiError>;
    code = body.code ?? code;
    message = body.message ?? message;
  } catch {
    // ignore parse errors — fall back to the generic message above
  }
  return { code, message, statusCode: res.status };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_INTERNAL_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) {
    const error = await parseErrorBody(res);
    throw new AuthApiRequestError(error.statusCode, error.code, error.message);
  }
  return res.json() as Promise<T>;
}

/** POST /auth/login — email + password, returns the API's token pair + user. */
export function loginWithPassword(input: LoginRequest): Promise<AuthSessionResponse> {
  return postJson<AuthSessionResponse>('/auth/login', input);
}

/** POST /auth/refresh — rotates both tokens. */
export function refreshSession(input: RefreshRequest): Promise<RefreshResponse> {
  return postJson<RefreshResponse>('/auth/refresh', input);
}

/**
 * POST /auth/logout — Bearer-authed, revokes the refresh token server-side.
 * Best-effort: a failure here must never block the client-side sign-out, so
 * this swallows errors rather than throwing.
 */
export async function logoutSession(accessToken: string, input: LogoutRequest): Promise<void> {
  try {
    await fetch(`${API_INTERNAL_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    // Best-effort revocation — the refresh token still expires on its own,
    // and the client-side session is cleared regardless.
  }
}

/**
 * Purpose: Base API client for mobile — attaches Clerk JWT to every authenticated request.
 * Why important: Single place to add auth headers so screens don't embed fetch logic.
 * Used by: Domain API modules (listings, credits, unlocks).
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class ApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Request failed: ${res.status}`;
    try {
      // API wraps errors as { error: { code, message }, meta: {...} }
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
        code?: string;
        message?: string;
      };
      code = body.error?.code ?? body.code ?? code;
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // ignore parse errors — keep the generic fallback
    }
    throw new ApiRequestError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}

/** Authenticated fetch — getToken is from Clerk's useAuth() hook. */
export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  return handleResponse<T>(res);
}

/** Unauthenticated fetch — for public endpoints (listing browse). */
export async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<T>(res);
}

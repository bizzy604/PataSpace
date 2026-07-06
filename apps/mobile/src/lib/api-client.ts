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

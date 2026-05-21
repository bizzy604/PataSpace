/**
 * Purpose: Base HTTP client for the PataSpace API, supporting both server and client contexts.
 * Why important: All web API calls go through here so auth headers are consistently attached.
 * Used by: Domain API modules (listings, credits, unlocks, user).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export type ApiError = {
  code: string;
  message: string;
  statusCode: number;
};

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
      const body = (await res.json()) as Partial<ApiError>;
      code = body.code ?? code;
      message = body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiRequestError(res.status, code, message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Server-side fetch — passes a Clerk token obtained from auth() on the server. */
export async function serverFetch<T>(path: string, token: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers, cache: 'no-store' });
  return handleResponse<T>(res);
}

/** Public server-side fetch — no auth, with Next.js cache revalidation. */
export async function publicServerFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate },
  });
  return handleResponse<T>(res);
}

/** Client-side fetch — getToken is from Clerk's useAuth() hook. */
export async function clientFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  return handleResponse<T>(res);
}

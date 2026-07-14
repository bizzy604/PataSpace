/**
 * Purpose: Auth API functions for the mobile app — register, phone-OTP verify
 *   and resend, email+password login, forgot/reset password, token refresh,
 *   logout, and the "who am I" profile fetch used to hydrate a cold start.
 * Why important: Every field name and endpoint here is the literal Phase-1
 *   API contract (packages/contracts/src/{schemas,types}/auth.ts); this is
 *   the one place mobile talks to /auth/* and /users/me so a contract change
 *   only needs updating here, not in every screen.
 * Used by: features/auth/auth-provider.tsx.
 */
import type {
  AuthSessionResponse,
  AuthTokens,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  UserProfile,
  VerifyOtpRequest,
} from '@pataspace/contracts';
import { apiFetch, publicFetch } from '../api-client';

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  return publicFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<AuthSessionResponse> {
  return publicFetch<AuthSessionResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(payload: ResendOtpRequest): Promise<ResendOtpResponse> {
  return publicFetch<ResendOtpResponse>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginRequest): Promise<AuthSessionResponse> {
  return publicFetch<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Always resolves 200 (anti-enumeration) — never reveals whether the email exists. */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return publicFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** 204 on success; revokes every existing session for the account server-side. */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await publicFetch<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Not routed through apiFetch's 401-retry: this function *is* the refresh
 * mechanism apiFetch calls into, so it must never itself trigger a retry
 * loop. A failed refresh (expired/revoked refresh token) throws
 * ApiRequestError and the caller (auth-provider) treats that as "session is
 * dead, sign out."
 */
export async function refresh(payload: RefreshRequest): Promise<RefreshResponse> {
  return publicFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Bearer-authed, best-effort from the caller's side — see useAuthSession().logout. */
export async function logout(
  getToken: () => Promise<string | null>,
  payload: LogoutRequest,
): Promise<void> {
  await apiFetch<void>('/auth/logout', getToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Hydrates the session's user on a cold start (refresh returns tokens only, no user). */
export async function fetchMe(getToken: () => Promise<string | null>): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', getToken);
}

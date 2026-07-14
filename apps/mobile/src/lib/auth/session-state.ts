/**
 * Purpose: Pure reducer for the mobile auth session state machine — no React,
 *   no SecureStore, no fetch. Given a state and an action, returns the next
 *   state deterministically so the transitions are unit-testable without
 *   mounting a provider.
 * Why important: The provider (auth-provider.tsx) is the only thing that talks
 *   to SecureStore/expo and the API; every branch of "what does signed-in vs
 *   signed-out vs still-loading look like, and how does a token refresh change
 *   it" lives here instead, where a bug is a red test, not a runtime surprise.
 * Used by: features/auth/auth-provider.tsx; __tests__/session-state.test.ts.
 */
import type { AuthUser } from '@pataspace/contracts';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; accessToken: string; user: AuthUser };

export type SessionAction =
  /** Cold-start hydration found no usable session (no stored refresh token, or it failed to redeem). */
  | { type: 'HYDRATE_SIGNED_OUT' }
  /** register/login/verify-otp/cold-start-refresh all resolve a full session. */
  | { type: 'SIGNED_IN'; accessToken: string; user: AuthUser }
  /** A silent 401 refresh minted a new access token for the existing session. */
  | { type: 'TOKEN_REFRESHED'; accessToken: string }
  /** Explicit logout, or a refresh that failed (the refresh token is dead). */
  | { type: 'SIGNED_OUT' };

export const initialSessionState: SessionState = { status: 'loading' };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE_SIGNED_OUT':
      return { status: 'signed_out' };
    case 'SIGNED_IN':
      return { status: 'signed_in', accessToken: action.accessToken, user: action.user };
    case 'TOKEN_REFRESHED':
      // Only meaningful while signed in; a stray refresh success after logout
      // (a slow in-flight promise resolving late) must not resurrect a session.
      return state.status === 'signed_in'
        ? { ...state, accessToken: action.accessToken }
        : state;
    case 'SIGNED_OUT':
      return { status: 'signed_out' };
    default:
      return state;
  }
}

export function isLoaded(state: SessionState): boolean {
  return state.status !== 'loading';
}

export function isSignedIn(state: SessionState): boolean {
  return state.status === 'signed_in';
}

export function currentAccessToken(state: SessionState): string | null {
  return state.status === 'signed_in' ? state.accessToken : null;
}

export function currentUser(state: SessionState): AuthUser | null {
  return state.status === 'signed_in' ? state.user : null;
}

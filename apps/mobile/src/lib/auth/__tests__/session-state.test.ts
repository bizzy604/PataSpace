/**
 * Purpose: Gate tests for the auth session reducer's state transitions.
 * Why important: This is the single source of truth for "signed in vs signed
 *   out vs still loading" that drives the root navigator's redirect effect and
 *   every screen's isAuthenticated check. A wrong transition here either locks
 *   a signed-in user out or leaves a signed-out one on an authenticated screen.
 * Used by: apps/mobile test lane (pnpm --filter @pataspace/mobile test).
 */
import { Role } from '@pataspace/contracts';
import type { AuthUser } from '@pataspace/contracts';
import {
  currentAccessToken,
  currentUser,
  initialSessionState,
  isLoaded,
  isSignedIn,
  sessionReducer,
  type SessionState,
} from '../session-state';

const user: AuthUser = {
  id: 'user-1',
  phoneNumber: '+254712345678',
  firstName: 'Amoni',
  lastName: 'Kevin',
  role: Role.USER,
  phoneVerified: true,
  emailVerified: true,
  email: 'amoni@example.com',
};

describe('initial state', () => {
  it('starts as loading (neither signed in nor signed out)', () => {
    expect(initialSessionState).toEqual({ status: 'loading' });
    expect(isLoaded(initialSessionState)).toBe(false);
    expect(isSignedIn(initialSessionState)).toBe(false);
  });
});

describe('sessionReducer', () => {
  it('HYDRATE_SIGNED_OUT moves loading to signed_out', () => {
    const next = sessionReducer(initialSessionState, { type: 'HYDRATE_SIGNED_OUT' });
    expect(next).toEqual({ status: 'signed_out' });
    expect(isLoaded(next)).toBe(true);
    expect(isSignedIn(next)).toBe(false);
  });

  it('SIGNED_IN moves any state to signed_in with the token and user', () => {
    const next = sessionReducer(initialSessionState, {
      type: 'SIGNED_IN',
      accessToken: 'access-1',
      user,
    });
    expect(next).toEqual({ status: 'signed_in', accessToken: 'access-1', user });
    expect(isSignedIn(next)).toBe(true);
    expect(currentAccessToken(next)).toBe('access-1');
    expect(currentUser(next)).toBe(user);
  });

  it('TOKEN_REFRESHED swaps the access token while staying signed in', () => {
    const signedIn: SessionState = { status: 'signed_in', accessToken: 'access-1', user };
    const next = sessionReducer(signedIn, { type: 'TOKEN_REFRESHED', accessToken: 'access-2' });
    expect(next).toEqual({ status: 'signed_in', accessToken: 'access-2', user });
  });

  it('TOKEN_REFRESHED is a no-op when not signed in (late resolve after logout)', () => {
    const signedOut: SessionState = { status: 'signed_out' };
    const next = sessionReducer(signedOut, { type: 'TOKEN_REFRESHED', accessToken: 'access-2' });
    expect(next).toBe(signedOut);
    expect(currentAccessToken(next)).toBeNull();
  });

  it('SIGNED_OUT resets from signed_in to signed_out', () => {
    const signedIn: SessionState = { status: 'signed_in', accessToken: 'access-1', user };
    const next = sessionReducer(signedIn, { type: 'SIGNED_OUT' });
    expect(next).toEqual({ status: 'signed_out' });
    expect(currentUser(next)).toBeNull();
  });

  it('SIGNED_OUT from loading also lands on signed_out', () => {
    const next = sessionReducer(initialSessionState, { type: 'SIGNED_OUT' });
    expect(next).toEqual({ status: 'signed_out' });
  });

  it('USER_UPDATED swaps the user while staying signed in (email verification)', () => {
    const signedIn: SessionState = { status: 'signed_in', accessToken: 'access-1', user };
    const verified = { ...user, emailVerified: true };
    const next = sessionReducer(signedIn, { type: 'USER_UPDATED', user: verified });
    expect(next).toEqual({ status: 'signed_in', accessToken: 'access-1', user: verified });
  });

  it('USER_UPDATED is a no-op when not signed in', () => {
    const signedOut: SessionState = { status: 'signed_out' };
    const next = sessionReducer(signedOut, { type: 'USER_UPDATED', user });
    expect(next).toBe(signedOut);
  });
});


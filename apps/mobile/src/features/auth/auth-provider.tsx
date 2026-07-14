/**
 * Purpose: Replaces @clerk/expo as the mobile session source. Holds the
 *   access token + user in memory, the refresh token in expo-secure-store,
 *   and exposes register/login/verify-otp/resend-otp/forgot-password/
 *   reset-password/logout plus a stable getToken() for every lib/api/*.ts
 *   call site (same shape Clerk's useAuth().getToken had, so downstream API
 *   modules needed zero signature changes).
 * Why important: This is the one place that talks to SecureStore and to
 *   /auth/*; it registers itself with lib/api-client.ts so any authenticated
 *   request that 401s gets a single-flight silent refresh + one retry
 *   (lib/auth/refresh-lock.ts), and it drives _layout.tsx's public-path
 *   redirect the same way Clerk's isLoaded/isSignedIn did.
 * Used by: app/_layout.tsx (provider), every screen/hook that previously
 *   called Clerk's useAuth/useClerk/useUser.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type {
  AuthSessionResponse,
  AuthUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  UserProfile,
  VerifyOtpRequest,
} from '@pataspace/contracts';
import { setAuthTokenSource } from '@/lib/api-client';
import * as authApi from '@/lib/api/auth';
import { createSingleFlight } from '@/lib/auth/refresh-lock';
import {
  currentAccessToken,
  currentUser,
  initialSessionState,
  isLoaded as sessionIsLoaded,
  isSignedIn as sessionIsSignedIn,
  sessionReducer,
  type SessionState,
} from '@/lib/auth/session-state';

const REFRESH_TOKEN_KEY = 'pataspace.refreshToken';

function profileToAuthUser(profile: UserProfile): AuthUser {
  return {
    id: profile.id,
    phoneNumber: profile.phoneNumber,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.role,
    phoneVerified: profile.phoneVerified,
    email: profile.email,
  };
}

type AuthSessionContextValue = {
  /** True once the cold-start hydration attempt (SecureStore -> refresh) has settled. */
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  /** Same shape as Clerk's useAuth().getToken — every lib/api/*.ts call site is unchanged. */
  getToken: () => Promise<string | null>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  verifyOtp: (payload: VerifyOtpRequest) => Promise<void>;
  resendOtp: (payload: ResendOtpRequest) => Promise<ResendOtpResponse>;
  login: (payload: LoginRequest) => Promise<void>;
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  // Refs mirror the latest state/refresh-token so callbacks registered once
  // (getToken, the api-client token source) never close over stale values.
  const stateRef = useRef<SessionState>(state);
  stateRef.current = state;
  const refreshTokenRef = useRef<string | null>(null);

  // Stable (empty-deps) so every callback below can list it as a dependency
  // without recreating itself every render; it only ever touches the ref and
  // SecureStore, never component state directly.
  const persistRefreshToken = useCallback(async (token: string | null) => {
    refreshTokenRef.current = token;
    try {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch {
      // SecureStore write failures shouldn't crash the auth flow — worst case
      // the user is asked to log in again next cold start.
    }
  }, []);

  const applySession = useCallback(
    async (session: AuthSessionResponse) => {
      await persistRefreshToken(session.refreshToken);
      dispatch({ type: 'SIGNED_IN', accessToken: session.accessToken, user: session.user });
    },
    [persistRefreshToken],
  );

  // The actual refresh call, wrapped single-flight below. Redeems the current
  // refresh token, rotates it in storage, and updates the access token in
  // state. Returns null (does not throw) when the refresh token is missing or
  // dead, since every caller treats "could not refresh" the same way.
  const runRefresh = useCallback(async (): Promise<string | null> => {
    const token = refreshTokenRef.current;
    if (!token) {
      return null;
    }
    try {
      const tokens = await authApi.refresh({ refreshToken: token });
      await persistRefreshToken(tokens.refreshToken);
      dispatch({ type: 'TOKEN_REFRESHED', accessToken: tokens.accessToken });
      return tokens.accessToken;
    } catch {
      await persistRefreshToken(null);
      dispatch({ type: 'SIGNED_OUT' });
      return null;
    }
  }, [persistRefreshToken]);

  const singleFlightRefresh = useMemo(() => createSingleFlight(runRefresh), [runRefresh]);

  // Cold-start hydration: a stored refresh token means "try to resume this
  // session." Redeem it for a fresh access token, then fetch the user
  // profile (POST /auth/refresh returns tokens only, no user). Any failure
  // in this chain means the session can't be resumed — clear storage and
  // land on signed_out, same as a user who never logged in.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let storedToken: string | null = null;
      try {
        storedToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      } catch {
        storedToken = null;
      }

      if (!storedToken) {
        if (!cancelled) dispatch({ type: 'HYDRATE_SIGNED_OUT' });
        return;
      }

      refreshTokenRef.current = storedToken;

      try {
        const tokens = await authApi.refresh({ refreshToken: storedToken });
        await persistRefreshToken(tokens.refreshToken);
        const profile = await authApi.fetchMe(async () => tokens.accessToken);
        if (!cancelled) {
          dispatch({
            type: 'SIGNED_IN',
            accessToken: tokens.accessToken,
            user: profileToAuthUser(profile),
          });
        }
      } catch {
        await persistRefreshToken(null);
        if (!cancelled) dispatch({ type: 'HYDRATE_SIGNED_OUT' });
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount only — persistRefreshToken is stable
    // (empty-deps useCallback) so omitting it here changes nothing at runtime.
  }, [persistRefreshToken]);

  // Registers this session with the base API client so apiFetch can silently
  // refresh + retry on a 401 from *any* domain call (credits, listings,
  // unlocks, ...), not just calls made through this provider.
  useEffect(() => {
    setAuthTokenSource({
      getAccessToken: () => currentAccessToken(stateRef.current),
      refreshAccessToken: singleFlightRefresh,
    });
    return () => setAuthTokenSource(null);
  }, [singleFlightRefresh]);

  const getToken = useCallback(async (): Promise<string | null> => {
    return currentAccessToken(stateRef.current);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    return authApi.register(payload);
  }, []);

  const verifyOtp = useCallback(
    async (payload: VerifyOtpRequest) => {
      const session = await authApi.verifyOtp(payload);
      await applySession(session);
    },
    [applySession],
  );

  const resendOtp = useCallback(async (payload: ResendOtpRequest) => {
    return authApi.resendOtp(payload);
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await authApi.login(payload);
      await applySession(session);
    },
    [applySession],
  );

  const forgotPassword = useCallback(async (payload: ForgotPasswordRequest) => {
    return authApi.forgotPassword(payload);
  }, []);

  const resetPassword = useCallback(
    async (payload: ResetPasswordRequest) => {
      // Server revokes every refresh token for the account on success, so any
      // session this device happened to hold is dead too — clear it locally
      // rather than waiting for the next 401 to discover that.
      await authApi.resetPassword(payload);
      await persistRefreshToken(null);
      dispatch({ type: 'SIGNED_OUT' });
    },
    [persistRefreshToken],
  );

  const logout = useCallback(async () => {
    const accessToken = currentAccessToken(stateRef.current);
    const refreshToken = refreshTokenRef.current;

    // Clear local state first — logout must succeed from the user's
    // perspective even if the network call fails or never returns.
    await persistRefreshToken(null);
    dispatch({ type: 'SIGNED_OUT' });

    if (accessToken && refreshToken) {
      try {
        await authApi.logout(async () => accessToken, { refreshToken });
      } catch {
        // Best-effort: the server session may outlive the local one until
        // the refresh token's own expiry, which is an accepted trade-off.
      }
    }
  }, [persistRefreshToken]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      isLoaded: sessionIsLoaded(state),
      isSignedIn: sessionIsSignedIn(state),
      user: currentUser(state),
      getToken,
      register,
      verifyOtp,
      resendOtp,
      login,
      forgotPassword,
      resetPassword,
      logout,
    }),
    [state, getToken, register, verifyOtp, resendOtp, login, forgotPassword, resetPassword, logout],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider');
  }

  return context;
}

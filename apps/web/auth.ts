/**
 * Purpose: NextAuth (Auth.js v5) configuration — the only identity layer left
 *   on the web app now that Clerk is gone. A Credentials provider exchanges
 *   email + password for the API's own JWT pair via POST /auth/login; the
 *   jwt callback carries those tokens forward and rotates them through
 *   POST /auth/refresh before they expire. Session strategy is jwt (no
 *   database session store) — the API is the source of truth for identity,
 *   NextAuth here is just a cookie-backed carrier for its tokens.
 * Why important: this is an admin console, not a general auth surface — a
 *   correct password for a non-admin account must still not mint a session
 *   here, so the role check happens inside authorize() itself, not just in
 *   route-gating UI.
 * Used by: app/api/auth/[...nextauth]/route.ts (handlers), proxy.ts (auth,
 *   for route protection), every server component/action that reads the
 *   signed-in admin's identity or bearer token (auth), the sign-in page and
 *   sign-out controls (signIn/signOut).
 */
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { Role, type AuthSessionResponse } from '@pataspace/contracts';
import { AuthApiRequestError, loginWithPassword, logoutSession, refreshSession } from '@/lib/api/auth';

// The API mints short-lived access tokens (ACCESS_TOKEN_TTL, default 15m —
// see apps/api/.env.example / infra/docker/.env.vps.example). Refresh 60s
// ahead of expiry so an in-flight request never races a live rotation.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_SKEW_SECONDS = 60;
// NextAuth session cookie lifetime must not outlive the API's refresh token
// (REFRESH_TOKEN_TTL_DAYS, default 30) — otherwise an admin gets a session
// cookie that looks valid but whose refresh token the API has already
// forgotten, producing a silent 401 loop. Match it exactly.
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// What authorize() hands to the jwt callback. The API's token pair rides on
// here (not on the augmented `User` interface — the session the client reads
// must never carry the refresh token), so the jwt callback casts its `user`
// param to this to read them on first sign-in.
type AuthorizedAdmin = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  phoneVerified: boolean;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
};

// Every code here is deliberately generic (never "wrong password" vs "no
// such account") to stay enumeration-safe end to end, matching the API's own
// anti-enumeration contract for login/forgot-password.
class InvalidCredentialsError extends CredentialsSignin {
  code = 'INVALID_CREDENTIALS';
}
class AccountBannedError extends CredentialsSignin {
  code = 'ACCOUNT_BANNED';
}
class AccountInactiveError extends CredentialsSignin {
  code = 'ACCOUNT_INACTIVE';
}
class PhoneNotVerifiedError extends CredentialsSignin {
  code = 'PHONE_NOT_VERIFIED';
}
class NotAdminError extends CredentialsSignin {
  code = 'NOT_ADMIN';
}
class LoginUnavailableError extends CredentialsSignin {
  code = 'LOGIN_UNAVAILABLE';
}

// Maps the API's own ApiError.code (see apps/api's UnauthorizedException /
// ForbiddenException bodies in auth.service.ts and auth-eligibility.policy.ts)
// onto a matching CredentialsSignin subclass, so the sign-in form can show
// the API's actual rejection reason instead of one generic message.
const API_ERROR_TO_SIGNIN_ERROR: Record<string, new () => CredentialsSignin> = {
  INVALID_CREDENTIALS: InvalidCredentialsError,
  ACCOUNT_BANNED: AccountBannedError,
  ACCOUNT_INACTIVE: AccountInactiveError,
  PHONE_NOT_VERIFIED: PhoneNotVerifiedError,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: '/admin/sign-in' },
  // Required off Vercel (self-hosted VPS behind nginx/Caddy) so Auth.js
  // trusts the Host header for callback URLs instead of rejecting the
  // request. AUTH_URL is set explicitly in production anyway (see
  // infra/docker/.env.vps.example); this covers local dev/preview.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) {
          throw new InvalidCredentialsError();
        }

        let session: AuthSessionResponse;
        try {
          session = await loginWithPassword({ email, password });
        } catch (error) {
          if (error instanceof AuthApiRequestError) {
            const SigninError = API_ERROR_TO_SIGNIN_ERROR[error.code];
            throw new (SigninError ?? LoginUnavailableError)();
          }
          throw new LoginUnavailableError();
        }

        if (session.user.role !== Role.ADMIN) {
          throw new NotAdminError();
        }

        // Typed as AuthorizedAdmin (not returned as a fresh literal) so the
        // API token fields — which are not part of the `User` interface —
        // don't trip excess-property checks against authorize's `User | null`
        // return type.
        const authorized: AuthorizedAdmin = {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
          phoneVerified: session.user.phoneVerified,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
        };
        return authorized;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in — `user` is exactly what authorize() returned above,
        // i.e. an AuthorizedAdmin. Cast to read the token fields, which live
        // there rather than on the public `User` interface.
        const admin = user as AuthorizedAdmin;
        token.userId = admin.id;
        token.email = admin.email;
        token.firstName = admin.firstName;
        token.lastName = admin.lastName;
        token.role = admin.role;
        token.phoneVerified = admin.phoneVerified;
        token.accessToken = admin.accessToken;
        token.refreshToken = admin.refreshToken;
        token.accessTokenExpiresAt = admin.accessTokenExpiresAt;
        token.error = undefined;
        return token;
      }

      // Subsequent requests: rotate ahead of expiry so a request never races
      // a live refresh.
      if (Date.now() < token.accessTokenExpiresAt - REFRESH_SKEW_SECONDS * 1000) {
        return token;
      }

      try {
        const rotated = await refreshSession({ refreshToken: token.refreshToken });
        token.accessToken = rotated.accessToken;
        token.refreshToken = rotated.refreshToken;
        token.accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000;
        token.error = undefined;
        return token;
      } catch {
        // The API's refresh token is gone (revoked, expired, or the account
        // was banned/deactivated since sign-in). Surface this on the session
        // so proxy.ts / the console layout treat it as unauthenticated
        // rather than silently retrying a dead token forever.
        token.error = 'RefreshTokenInvalid';
        return token;
      }
    },
    async session({ session, token }) {
      // The callback's `session.user` type is intersected with AdapterUser
      // (which types `email` as non-null `string`) to cover both db and jwt
      // session strategies, even though this app is jwt-only and its email is
      // genuinely nullable. The cast reconciles that quirk — the runtime
      // value and the augmented Session['user'] type both allow null.
      session.user = {
        id: token.userId,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        role: token.role,
        phoneVerified: token.phoneVerified,
      } as typeof session.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  events: {
    // Best-effort server-side revocation of the API's refresh token whenever
    // a NextAuth session ends (explicit sign-out, or the session cookie
    // simply expiring). Never blocks sign-out — logoutSession() swallows its
    // own errors.
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      if (token?.accessToken && token?.refreshToken) {
        await logoutSession(token.accessToken, { refreshToken: token.refreshToken });
      }
    },
  },
});

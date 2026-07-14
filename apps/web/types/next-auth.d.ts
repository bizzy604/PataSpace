/**
 * Purpose: Module augmentation for Auth.js's User/Session/JWT types — adds the
 *   fields the admin console needs (profile names, role, the API's own
 *   access/refresh tokens) on top of Auth.js's default shape.
 * Why important: auth.ts stashes the API's token pair and the admin's role in
 *   the JWT/session; without this augmentation every read of those fields
 *   elsewhere (proxy.ts, admin layout, use-admin-data.ts) would be
 *   `unknown`. These declarations target `@auth/core/*` — not `next-auth` —
 *   on purpose: `next-auth` re-exports these interfaces with `export type`,
 *   which is a type-only alias that declaration merging cannot attach to, and
 *   the callback signatures inside `@auth/core` reference `@auth/core`'s own
 *   `User`/`Session`/`JWT`. `@auth/core` is pinned as a direct devDependency
 *   (matching next-auth's exact version) so these specifiers resolve from
 *   apps/web; without it pnpm's strict layout makes the augmentation a
 *   silent no-op.
 * Used by: auth.ts, proxy.ts, app/admin/(console)/layout.tsx,
 *   components/admin/use-admin-data.ts.
 */
import type { Role } from '@pataspace/contracts';

declare module '@auth/core/types' {
  // Only NEW members here — redeclaring DefaultUser's `id`/`email` with a
  // different optional-modifier is a declaration-merge error.
  interface User {
    firstName: string;
    lastName: string;
    role: Role;
    phoneVerified: boolean;
  }

  interface Session {
    // A plain object (not intersected with DefaultSession['user']) — it is
    // already structurally assignable to the base `user?: User`, and the
    // intersection form distributes `& undefined` in a way that mis-narrows
    // the nullable `email`. Deliberately narrower than the JWT: the refresh
    // token never reaches the session the client can read.
    user: {
      id: string;
      email: string | null;
      firstName: string;
      lastName: string;
      role: Role;
      phoneVerified: boolean;
    };
    /** The API's access token — the Bearer credential for every /api/v1 call. */
    accessToken: string;
    /**
     * Set when refresh-token rotation failed in the jwt callback. Callers
     * that see this must treat the session as unauthenticated (the access
     * token is stale and the API will reject it).
     */
    error?: 'RefreshTokenMissing' | 'RefreshTokenInvalid';
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userId: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: Role;
    phoneVerified: boolean;
    accessToken: string;
    refreshToken: string;
    /** Epoch ms — when the current accessToken expires. */
    accessTokenExpiresAt: number;
    error?: 'RefreshTokenMissing' | 'RefreshTokenInvalid';
  }
}

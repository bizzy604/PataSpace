/**
 * Purpose: NextAuth's REST surface (signin/signout/session/csrf/callback) for
 *   the Credentials provider.
 * Why important: This is the only place NextAuth needs to be mounted as a
 *   route — everything else (sign-in form, proxy.ts, server components) goes
 *   through the `auth`/`signIn`/`signOut` exports from ../../../../auth.ts.
 * Used by: next-auth's client helpers (`signIn`, `signOut`, `useSession`) and
 *   proxy.ts's session cookie refresh, all internally.
 */
import { handlers } from '@/auth';

export const { GET, POST } = handlers;

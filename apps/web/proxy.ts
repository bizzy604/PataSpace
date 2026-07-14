/**
 * Purpose: Middleware for the landing + admin web app.
 * Why important: Two gates. The public gate is pure Next (no auth) so the
 *   marketing surface and retired-route redirects work deterministically.
 *   The admin gate reads the NextAuth session cookie (via `auth`) and
 *   requires both a signed-in session and the ADMIN role; the role check is
 *   defense in depth — the console layout re-checks it server-side, and the
 *   API's Role.ADMIN guard is the authoritative boundary.
 * Used by: Next.js proxy runtime for every request (the renamed middleware
 *   convention as of Next 16 — see next.config.mjs / package.json for the
 *   Next version this targets).
 */
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PUBLIC_PATHS = [
  '/',
  '/about',
  '/how-it-works',
  '/pricing',
  '/_next',
  '/brand',
  '/mock',
  '/favicon.ico',
  '/api',
];

const ADMIN_ROUTE_PREFIX = '/admin';
const ADMIN_SIGN_IN_PATH = '/admin/sign-in';

function isAdminRoute(pathname: string): boolean {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
}

function isAdminSignInRoute(pathname: string): boolean {
  return pathname === ADMIN_SIGN_IN_PATH || pathname.startsWith(`${ADMIN_SIGN_IN_PATH}/`);
}

// `auth` injects the resolved session on `request.auth` (typed NextAuthRequest
// by the wrapper) and forwards our return value as the middleware response.
export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (isAdminRoute(pathname)) {
    if (isAdminSignInRoute(pathname)) {
      return NextResponse.next();
    }

    const session = request.auth;
    // No session, the jwt callback flagged a dead/rotated-out refresh token,
    // or the role is not ADMIN — in every case the API would reject the
    // access token, so bounce to sign-in rather than let the console render
    // and 401 on first fetch.
    if (!session || !session.user || session.error || session.user.role !== 'ADMIN') {
      const signInUrl = new URL(ADMIN_SIGN_IN_PATH, request.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPublic) {
    // Retired tenant routes and anything unknown go back to the landing page.
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

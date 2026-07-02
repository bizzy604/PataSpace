/**
 * Purpose: Middleware for the landing + admin web app.
 * Why important: Two gates. The public gate is pure Next (no Clerk) so the
 *   marketing surface and retired-route redirects work deterministically.
 *   The admin gate runs clerkMiddleware and requires a session; the ADMIN
 *   role itself is checked in the console layout and, authoritatively, by
 *   the API's Role.ADMIN guard.
 * Used by: Next.js middleware runtime for every request.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

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

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAdminSignInRoute = createRouteMatcher(['/admin/sign-in(.*)']);

const adminMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isAdminSignInRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL('/admin/sign-in', req.url).toString(),
    });
  }
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isAdminRoute(request)) {
    return adminMiddleware(request, event);
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isPublic) {
    // Retired tenant routes and anything unknown go back to the landing page.
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

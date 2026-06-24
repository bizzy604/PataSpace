import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const WAITLIST_MODE = true;

const WAITLIST_ALLOWED = [
  '/',
  '/_next',
  '/brand',
  '/mock',
  '/favicon.ico',
  '/api',
];

const isProtectedRoute = createRouteMatcher([
  '/wallet(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/notifications(.*)',
  '/saved(.*)',
  '/unlocks(.*)',
  '/referrals(.*)',
  '/post(.*)',
  '/listings/:id/unlock(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (WAITLIST_MODE) {
    const { pathname } = req.nextUrl;
    const isAllowed = WAITLIST_ALLOWED.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

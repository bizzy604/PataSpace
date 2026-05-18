// Clerk proxy — protects authenticated routes and handles sign-in redirects.
// All routes under /wallet, /profile, /settings, /notifications, /saved, /unlocks,
// and /post require an active Clerk session. Unauthenticated requests are redirected
// to /auth/sign-in; after sign-in Clerk falls back to /wallet.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/wallet(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/notifications(.*)',
  '/saved(.*)',
  '/unlocks(.*)',
  '/post(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

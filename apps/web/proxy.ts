// Clerk proxy — protects authenticated routes and handles sign-in redirects.
// Workspace routes (/wallet, /profile, /settings, /notifications, /saved, /unlocks, /post)
// require an active Clerk session. The unlock step (/listings/:id/unlock) also requires
// sign-in; all other listing routes are publicly browsable without an account.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/wallet(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/notifications(.*)',
  '/saved(.*)',
  '/unlocks(.*)',
  '/post(.*)',
  '/listings/:id/unlock(.*)',
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

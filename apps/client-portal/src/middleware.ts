import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Client portal middleware.
 * Protects all routes except the sign-in page and the landing page.
 */
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

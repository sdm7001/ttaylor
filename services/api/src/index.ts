/**
 * @ttaylor/api -- Public API surface.
 *
 * Re-exports the root router and its type for use by the Next.js
 * app and any other consumers of the tRPC API.
 */
export { appRouter, type AppRouter } from './router';
export { createContext, type Context } from './context';
export { createCallerFactory } from './trpc';

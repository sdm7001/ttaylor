/**
 * Core tRPC initialization for the Ttaylor API.
 *
 * Sets up:
 * - tRPC instance with superjson transformer
 * - Public and protected procedure bases
 * - Permission-checking middleware factory
 * - Caller factory for server-side calls
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from './context';

/**
 * tRPC instance -- configured once, used everywhere.
 */
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Router factory.
 */
export const router = t.router;

/**
 * Public procedure -- no auth required.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware that enforces authentication.
 * Throws UNAUTHORIZED if no userId is present in the context.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.userRecord) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Narrow the types so downstream code knows these are non-null
      userId: ctx.userId,
      userRecord: ctx.userRecord,
    },
  });
});

/**
 * Protected procedure -- requires a valid authenticated session.
 */
export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * Middleware factory that checks whether the authenticated user
 * holds a specific permission code.
 *
 * Usage:
 *   protectedProcedure.use(requirePermission('matters.create'))
 */
export function requirePermission(permission: string) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.permissions.has(permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permission}`,
      });
    }
    return next({ ctx });
  });
}

/**
 * Middleware factory that checks whether the user holds one of the
 * specified role levels.
 *
 * Usage:
 *   protectedProcedure.use(requireRole('ATTORNEY', 'PARALEGAL'))
 */
export function requireRole(...requiredRoles: string[]) {
  return t.middleware(({ ctx, next }) => {
    const hasRole = ctx.roles.some((r) => requiredRoles.includes(r));
    if (!hasRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Requires one of: ${requiredRoles.join(', ')}`,
      });
    }
    return next({ ctx });
  });
}

/**
 * Caller factory -- enables server-side procedure calls without HTTP.
 */
export const createCallerFactory = t.createCallerFactory;

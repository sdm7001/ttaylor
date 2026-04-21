/**
 * tRPC context creation for the Ttaylor API.
 *
 * Compatible with Next.js App Router fetch handler.
 * Extracts the Clerk session from request headers, looks up the
 * corresponding user in the database, and loads their roles.
 */
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { verifyToken } from '@clerk/backend';
import { type PrismaClient, type User } from '@prisma/client';
import { db } from './prisma';
import { RoleLevel, resolvePermissions } from '@ttaylor/auth';

export interface Context {
  /** Clerk user ID, null if unauthenticated. */
  userId: string | null;
  /** Full user record from the database, null if unauthenticated or not found. */
  userRecord: User | null;
  /** Prisma client singleton. */
  prisma: PrismaClient;
  /** Effective role levels for the authenticated user. */
  roles: string[];
  /** Resolved permission codes for the authenticated user. */
  permissions: Set<string>;
}

/**
 * Create the tRPC context from an incoming fetch request.
 *
 * This function:
 * 1. Extracts the Bearer token from the Authorization header
 * 2. Verifies the token with Clerk
 * 3. Loads the user record and roles from the database
 * 4. Resolves permissions from role assignments
 */
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  const authHeader = opts.req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return {
      userId: null,
      userRecord: null,
      prisma: db,
      roles: [],
      permissions: new Set(),
    };
  }

  try {
    const sessionClaims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const clerkUserId = sessionClaims.sub;

    // Look up user by email (Clerk sub is the Clerk user ID; we match via email
    // synced during Clerk webhook). For now we store the Clerk ID in a lookup.
    // The user table does not have a clerkId column in the canonical schema,
    // so we match on the email from the Clerk session claims.
    const userWithRoles = await db.user.findFirst({
      where: {
        // Match by Clerk external ID stored in the id or by email.
        // In production, a clerk_user_id column or a separate mapping table
        // would be used. For Phase 4 scaffolding we match on the cuid id field
        // which is set to the Clerk user ID during user sync.
        id: clerkUserId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      return {
        userId: clerkUserId,
        userRecord: null,
        prisma: db,
        roles: [],
        permissions: new Set(),
      };
    }

    const roles = userWithRoles.userRoles.map((ur) => ur.role.level);
    const permissions = resolvePermissions(roles as RoleLevel[]);

    return {
      userId: userWithRoles.id,
      userRecord: userWithRoles,
      prisma: db,
      roles,
      permissions,
    };
  } catch {
    // Token verification failed -- treat as unauthenticated
    return {
      userId: null,
      userRecord: null,
      prisma: db,
      roles: [],
      permissions: new Set(),
    };
  }
}

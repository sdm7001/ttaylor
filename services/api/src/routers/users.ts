/**
 * Users tRPC router.
 *
 * Provides user lookup endpoints for dropdowns and assignments.
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const usersRouter = router({
  /**
   * List all users with ATTORNEY role for the current organization.
   * Used to populate attorney dropdown selectors.
   */
  listAttorneys: protectedProcedure.query(async ({ ctx }) => {
    const attorneys = await ctx.prisma.user.findMany({
      where: {
        orgId: ctx.orgId,
        roles: {
          some: {
            role: {
              name: 'ATTORNEY',
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return attorneys;
  }),

  /**
   * List all users for a given role. General-purpose version of listAttorneys.
   */
  listByRole: protectedProcedure
    .input(z.object({ role: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          orgId: ctx.orgId,
          roles: {
            some: {
              role: {
                name: input.role,
              },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: { lastName: 'asc' },
      });

      return users;
    }),
});

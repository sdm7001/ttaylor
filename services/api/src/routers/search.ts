/**
 * Global search tRPC router.
 *
 * Provides cross-entity search across matters, contacts, and documents.
 * All queries use ILIKE for case-insensitive partial matching.
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const searchRouter = router({
  /**
   * Global search across matters, contacts, and documents.
   * Returns up to `limit` results per entity type.
   */
  global: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2).max(200),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      const [matters, contacts, documents] = await Promise.all([
        // Search matters by causeNumber or title (title contains court info)
        ctx.prisma.matter.findMany({
          where: {
            OR: [
              { causeNumber: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            causeNumber: true,
            title: true,
            status: true,
            matterTypeId: true,
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),

        // Search contacts by first name, last name, or email
        ctx.prisma.contact.findMany({
          where: {
            deletedAt: null,
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),

        // Search documents by title
        ctx.prisma.document.findMany({
          where: {
            title: { contains: query, mode: 'insensitive' },
          },
          select: {
            id: true,
            title: true,
            lifecycleStatus: true,
            matterId: true,
            matter: { select: { id: true, title: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        matters,
        contacts,
        documents,
        total: matters.length + contacts.length + documents.length,
      };
    }),
});

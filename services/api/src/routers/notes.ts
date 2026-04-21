/**
 * Notes tRPC router.
 *
 * Manages notes attached to matters. Supports privileged (attorney-client)
 * flagging for notes containing sensitive communications.
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const notesRouter = router({
  /**
   * List all non-deleted notes for a matter, newest first.
   * Includes author name for display.
   */
  listForMatter: protectedProcedure
    .input(z.object({ matterId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.note.findMany({
        where: { matterId: input.matterId, deletedAt: null },
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Create a note on a matter.
   * Emits an audit event for compliance tracking.
   */
  create: protectedProcedure
    .input(
      z.object({
        matterId: z.string(),
        content: z.string().min(1).max(10000),
        isPrivileged: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.create({
        data: {
          matterId: input.matterId,
          authorId: ctx.userId,
          content: input.content,
          isPrivileged: input.isPrivileged,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'Note',
        entityId: note.id,
        matterId: input.matterId,
        metadata: { action: 'note_created' },
      });

      return note;
    }),
});

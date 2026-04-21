/**
 * Dashboard tRPC router.
 *
 * Provides an aggregate summary endpoint for the staff dashboard,
 * running 5 parallel Prisma queries to produce counts and a
 * recent activity feed.
 */
import { router, protectedProcedure } from '../trpc';

export const dashboardRouter = router({
  /**
   * Get dashboard summary: counts for active matters, pending documents,
   * filing queue, upcoming deadlines, plus a recent activity feed.
   *
   * All 5 queries run in parallel via Promise.all.
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeMatters,
      pendingDocuments,
      filingQueue,
      upcomingDeadlines,
      recentActivity,
    ] = await Promise.all([
      // 1. Count matters with active-ish statuses
      ctx.prisma.matter.count({
        where: {
          status: {
            in: ['OPEN', 'ACTIVE', 'DISCOVERY', 'NEGOTIATION', 'MEDIATION', 'TRIAL_PREP'],
          },
        },
      }),

      // 2. Count documents that are NOT in a terminal/filed state (pending/in-flight)
      ctx.prisma.document.count({
        where: {
          lifecycleStatus: {
            notIn: ['FILED', 'ARCHIVED'],
          },
        },
      }),

      // 3. Count filing packets that are actively being worked on
      //    Using readinessStatus from the Prisma schema enum
      ctx.prisma.filingPacket.count({
        where: {
          readinessStatus: {
            notIn: ['ACCEPTED', 'COMPLETED', 'REJECTED'],
          },
        },
      }),

      // 4. Count deadlines due within 7 days that are not yet completed
      ctx.prisma.deadline.count({
        where: {
          dueAt: { lte: sevenDaysFromNow },
          status: { not: 'completed' },
        },
      }),

      // 5. 10 most recent audit events for the activity feed
      ctx.prisma.auditEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      activeMatters,
      pendingDocuments,
      filingQueue,
      upcomingDeadlines,
      recentActivity: recentActivity.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        actorName: event.actor
          ? `${event.actor.firstName} ${event.actor.lastName}`
          : 'System',
        resourceType: event.entityType,
        resourceId: event.entityId,
        matterId: null as string | null, // Matter ID not directly on audit event; available via entityType check
        createdAt: event.createdAt,
        metadata: event.payloadJson,
      })),
    };
  }),
});

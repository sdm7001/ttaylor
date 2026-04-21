/**
 * Calendar tRPC router.
 *
 * Manages calendar events, court dates, and deadlines for matters.
 * Integrates with the Texas deadline calculator for automatic
 * deadline computation when court dates are entered.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const eventTypeValues = [
  'HEARING',
  'DEADLINE',
  'MEETING',
  'MEDIATION',
  'DEPOSITION',
  'OTHER',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const calendarRouter = router({
  /**
   * List calendar events and deadlines in a date range,
   * optionally filtered by matter.
   */
  listEvents: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { matterId, startDate, endDate } = input;

      const eventWhere: Record<string, unknown> = {
        startAt: { gte: startDate, lte: endDate },
      };
      if (matterId) eventWhere.matterId = matterId;

      const deadlineWhere: Record<string, unknown> = {
        dueAt: { gte: startDate, lte: endDate },
      };
      if (matterId) deadlineWhere.matterId = matterId;

      const [events, deadlines] = await Promise.all([
        ctx.prisma.calendarEvent.findMany({
          where: eventWhere,
          orderBy: { startAt: 'asc' },
          include: {
            matter: { select: { id: true, title: true, causeNumber: true } },
          },
        }),
        ctx.prisma.deadline.findMany({
          where: deadlineWhere,
          orderBy: { dueAt: 'asc' },
          include: {
            matter: { select: { id: true, title: true, causeNumber: true } },
          },
        }),
      ]);

      return { events, deadlines };
    }),

  /**
   * Create a calendar event for a matter.
   *
   * If `isCourtDate` is true, the response includes suggested deadlines
   * that the caller may want to create (e.g. filing deadlines relative
   * to the hearing date).
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid(),
        title: z.string().min(1).max(500),
        eventType: z.enum(eventTypeValues),
        startAt: z.date(),
        endAt: z.date().optional(),
        location: z.string().max(500).optional(),
        notes: z.string().max(5000).optional(),
        isCourtDate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify matter exists
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const event = await ctx.prisma.calendarEvent.create({
        data: {
          matterId: input.matterId,
          title: input.title,
          eventType: input.eventType,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          location: input.location ?? null,
          notes: input.notes ?? null,
          isCourtDate: input.isCourtDate,
          createdById: ctx.userId,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'CalendarEvent',
        entityId: event.id,
        metadata: {
          matterId: input.matterId,
          eventType: input.eventType,
          isCourtDate: input.isCourtDate,
          title: input.title,
        },
      });

      // If this is a court date, suggest relevant deadlines
      let suggestedDeadlines: Array<{ title: string; dueAt: Date; ruleId: string }> = [];
      if (input.isCourtDate) {
        // Common pre-hearing deadlines in Texas family law
        const hearingDate = input.startAt;

        // Pre-trial disclosures: 30 days before hearing
        const preTrialDate = new Date(hearingDate);
        preTrialDate.setDate(preTrialDate.getDate() - 30);

        // Exhibit exchange: 14 days before hearing
        const exhibitDate = new Date(hearingDate);
        exhibitDate.setDate(exhibitDate.getDate() - 14);

        suggestedDeadlines = [
          {
            title: `Pre-trial disclosures due -- ${input.title}`,
            dueAt: preTrialDate,
            ruleId: 'pretrial-disclosure-30',
          },
          {
            title: `Exhibit exchange due -- ${input.title}`,
            dueAt: exhibitDate,
            ruleId: 'exhibit-exchange-14',
          },
        ];
      }

      return { event, suggestedDeadlines };
    }),

  /**
   * Create a deadline record for a matter.
   */
  createDeadline: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid(),
        title: z.string().min(1).max(500),
        dueAt: z.date(),
        ruleId: z.string().max(100).optional(),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const deadline = await ctx.prisma.deadline.create({
        data: {
          matterId: input.matterId,
          title: input.title,
          dueAt: input.dueAt,
          ruleId: input.ruleId ?? null,
          notes: input.notes ?? null,
          createdById: ctx.userId,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Deadline',
        entityId: deadline.id,
        metadata: {
          matterId: input.matterId,
          title: input.title,
          dueAt: input.dueAt.toISOString(),
          ruleId: input.ruleId,
        },
      });

      return deadline;
    }),

  /**
   * Get upcoming deadlines and court events within the next N days.
   *
   * If `assignedToMe` is true, filters to matters assigned to the caller.
   * ATTORNEYs and ADMINs see all matters by default.
   */
  getUpcoming: protectedProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(14),
        assignedToMe: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + input.days);

      // If not attorney/admin and assignedToMe not explicitly false, scope to assigned matters
      const isPrivileged = ctx.roles.includes('ATTORNEY') || ctx.roles.includes('ADMIN');
      const scopeToAssigned = input.assignedToMe || (!isPrivileged && input.assignedToMe !== false);

      let matterFilter: Record<string, unknown> | undefined;
      if (scopeToAssigned) {
        matterFilter = {
          assignments: { some: { userId: ctx.userId } },
        };
      }

      const [deadlines, courtEvents] = await Promise.all([
        ctx.prisma.deadline.findMany({
          where: {
            dueAt: { gte: now, lte: endDate },
            completedAt: null,
            ...(matterFilter ? { matter: matterFilter } : {}),
          },
          orderBy: { dueAt: 'asc' },
          include: {
            matter: { select: { id: true, title: true, causeNumber: true } },
          },
        }),
        ctx.prisma.calendarEvent.findMany({
          where: {
            startAt: { gte: now, lte: endDate },
            isCourtDate: true,
            ...(matterFilter ? { matter: matterFilter } : {}),
          },
          orderBy: { startAt: 'asc' },
          include: {
            matter: { select: { id: true, title: true, causeNumber: true } },
          },
        }),
      ]);

      return { deadlines, courtEvents };
    }),
});

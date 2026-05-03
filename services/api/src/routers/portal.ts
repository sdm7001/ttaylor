/**
 * Portal tRPC router.
 *
 * Handles client-portal messaging, document sharing, and portal-specific
 * queries. These endpoints serve the client-portal app.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import type { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Access guard
// ---------------------------------------------------------------------------

/**
 * Verifies the caller is authorized to access a given matter through the portal.
 *
 * Staff users must be assigned to the matter via MatterAssignment.
 * Portal clients are accepted if the matter has an active PortalAccess grant.
 *
 * NOTE: Per-client user scoping for portal clients requires adding a `userId`
 * field to the `PortalAccess` model (schema migration). Until then, any
 * authenticated portal client can access matters that have been explicitly
 * opened for portal access by staff.
 */
async function assertPortalAccess(
  prisma: PrismaClient,
  matterId: string,
  userId: string | null,
  roles: string[],
): Promise<void> {
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const staffRoles = ['ATTORNEY', 'PARALEGAL', 'LEGAL_ASSISTANT', 'RECEPTIONIST', 'ADMIN'];
  const isStaff = roles.some((r) => staffRoles.includes(r));

  if (isStaff) {
    const assignment = await prisma.matterAssignment.findFirst({
      where: { matterId, userId },
    });
    if (!assignment) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not assigned to this matter',
      });
    }
    return;
  }

  // Portal client: matter must have been explicitly shared via PortalAccess
  const access = await prisma.portalAccess.findFirst({
    where: { matterId },
  });
  if (!access) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Portal access has not been granted for this matter',
    });
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const portalRouter = router({
  /**
   * Submit intake questionnaire answers for a matter.
   * Creates or updates an intake_questionnaire record.
   * Emits an audit event so staff is notified.
   */
  submitQuestionnaire: protectedProcedure
    .input(
      z.object({
        matterId: z.string(),
        answers: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertPortalAccess(ctx.prisma, input.matterId, ctx.userId, ctx.roles);

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

      // Upsert questionnaire: check if one already exists for this matter + user
      const existing = await ctx.prisma.intakeQuestionnaire.findFirst({
        where: {
          matterId: input.matterId,
          submittedByUserId: ctx.userId,
        },
      });

      let questionnaire;
      if (existing) {
        questionnaire = await ctx.prisma.intakeQuestionnaire.update({
          where: { id: existing.id },
          data: {
            answersJson: input.answers,
            submittedAt: new Date(),
          },
        });
      } else {
        questionnaire = await ctx.prisma.intakeQuestionnaire.create({
          data: {
            matterId: input.matterId,
            submittedByUserId: ctx.userId!,
            answersJson: input.answers,
            submittedAt: new Date(),
          },
        });
      }

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId!,
        entityType: 'IntakeQuestionnaire',
        entityId: questionnaire.id,
        metadata: {
          matterId: input.matterId,
          action: existing ? 'questionnaire_updated' : 'questionnaire_submitted',
          answerCount: Object.keys(input.answers).length,
        },
      });

      return {
        id: questionnaire.id,
        submittedAt: questionnaire.submittedAt,
      };
    }),

  /**
   * Get messages for a matter's portal communication thread.
   */
  getMessages: protectedProcedure
    .input(z.object({ matterId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertPortalAccess(ctx.prisma, input.matterId, ctx.userId, ctx.roles);

      // Find or return null for the portal thread
      const thread = await ctx.prisma.communicationThread.findFirst({
        where: {
          matterId: input.matterId,
          channelType: 'PORTAL',
        },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
          },
        },
      });

      if (!thread) {
        return { thread: null, messages: [] };
      }

      return {
        thread: {
          id: thread.id,
          subject: thread.subject,
          createdAt: thread.createdAt,
        },
        messages: thread.messages.map((msg) => ({
          id: msg.id,
          senderType: msg.senderType,
          senderUserId: msg.senderUserId,
          senderContactId: msg.senderContactId,
          body: msg.body,
          sentAt: msg.sentAt,
          deliveryStatus: msg.deliveryStatus,
        })),
      };
    }),

  /**
   * Send a message in a matter's portal thread.
   * Finds or creates the portal thread, then creates a message.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        matterId: z.string(),
        body: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertPortalAccess(ctx.prisma, input.matterId, ctx.userId, ctx.roles);

      // Find existing portal thread or create one
      let thread = await ctx.prisma.communicationThread.findFirst({
        where: {
          matterId: input.matterId,
          channelType: 'PORTAL',
        },
      });

      if (!thread) {
        thread = await ctx.prisma.communicationThread.create({
          data: {
            matterId: input.matterId,
            channelType: 'PORTAL',
            subject: 'Portal Messages',
            visibilityScope: 'portal',
          },
        });
      }

      // Determine sender type based on user roles
      const isStaff = ctx.roles.some((r) =>
        ['ATTORNEY', 'PARALEGAL', 'LEGAL_ASSISTANT', 'RECEPTIONIST', 'ADMIN'].includes(r),
      );

      const message = await ctx.prisma.communicationMessage.create({
        data: {
          threadId: thread.id,
          senderType: isStaff ? 'STAFF' : 'CLIENT',
          senderUserId: ctx.userId,
          body: input.body,
        },
      });

      return {
        id: message.id,
        threadId: thread.id,
        senderType: message.senderType,
        body: message.body,
        sentAt: message.sentAt,
      };
    }),

  /**
   * Share a document with the client portal.
   * Restricted to PARALEGAL or higher. Document must be APPROVED or FILED.
   */
  shareDocument: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .input(
      z.object({
        matterId: z.string(),
        documentId: z.string(),
        clientNote: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate document exists and has appropriate status
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      if (document.matterId !== input.matterId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Document does not belong to this matter',
        });
      }

      const shareableStatuses = ['APPROVED', 'FILED'];
      if (!shareableStatuses.includes(document.lifecycleStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Document must be APPROVED or FILED to share. Current status: ${document.lifecycleStatus}`,
        });
      }

      // Use PortalAccess to track shared documents.
      // We create a portal_access record linking the matter to a "document share" entry.
      // Since the schema doesn't have a dedicated portal_document_share table,
      // we record the share as an audit event and use PortalAccess for access tracking.

      // Check if already shared (via audit event) to prevent duplicates
      const existingShare = await ctx.prisma.auditEvent.findFirst({
        where: {
          entityType: 'Document',
          entityId: input.documentId,
          eventType: 'PORTAL_INVITED',
        },
      });

      if (existingShare) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Document has already been shared with the client portal',
        });
      }

      await emitAuditEvent(ctx.prisma, {
        eventType: 'PORTAL_INVITED',
        actorId: ctx.userId!,
        entityType: 'Document',
        entityId: input.documentId,
        metadata: {
          matterId: input.matterId,
          clientNote: input.clientNote,
          documentTitle: document.title,
          sharedAt: new Date().toISOString(),
        },
      });

      return {
        documentId: input.documentId,
        matterId: input.matterId,
        sharedAt: new Date().toISOString(),
        sharedBy: ctx.userId,
      };
    }),

  /**
   * Get documents shared with the portal for a given matter.
   * Looks up audit events of type PORTAL_INVITED for documents in this matter.
   */
  getSharedDocuments: protectedProcedure
    .input(z.object({ matterId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertPortalAccess(ctx.prisma, input.matterId, ctx.userId, ctx.roles);

      // Find all documents in this matter that have been shared (via audit events)
      const shareEvents = await ctx.prisma.auditEvent.findMany({
        where: {
          entityType: 'Document',
          eventType: 'PORTAL_INVITED',
          payloadJson: {
            path: ['matterId'],
            equals: input.matterId,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (shareEvents.length === 0) {
        return [];
      }

      // Fetch the actual documents
      const documentIds = shareEvents.map((e) => e.entityId);
      const documents = await ctx.prisma.document.findMany({
        where: {
          id: { in: documentIds },
          matterId: input.matterId,
        },
      });

      // Merge share info with document data
      const shareMap = new Map(
        shareEvents.map((e) => [
          e.entityId,
          {
            sharedAt: e.createdAt,
            sharedBy: e.actorUserId,
          },
        ]),
      );

      return documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        documentType: doc.documentType,
        lifecycleStatus: doc.lifecycleStatus,
        sharedAt: shareMap.get(doc.id)?.sharedAt ?? null,
        sharedBy: shareMap.get(doc.id)?.sharedBy ?? null,
      }));
    }),
});

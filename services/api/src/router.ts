/**
 * Root application router for the Ttaylor tRPC API.
 *
 * Composes all module-level routers into a single appRouter.
 * The AppRouter type is exported for client-side type inference.
 */
import { router } from './trpc';
import { mattersRouter } from './routers/matters';
import { documentsRouter } from './routers/documents';
import { intakeRouter } from './routers/intake';
import { auditRouter } from './routers/audit';

export const appRouter = router({
  matters: mattersRouter,
  documents: documentsRouter,
  intake: intakeRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;

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
import { checklistsRouter } from './routers/checklists';
import { calendarRouter } from './routers/calendar';
import { contactsRouter } from './routers/contacts';
import { discoveryRouter } from './routers/discovery';
import { financialRouter } from './routers/financial';
import { ordersRouter } from './routers/orders';

export const appRouter = router({
  matters: mattersRouter,
  documents: documentsRouter,
  intake: intakeRouter,
  audit: auditRouter,
  checklists: checklistsRouter,
  calendar: calendarRouter,
  contacts: contactsRouter,
  discovery: discoveryRouter,
  financial: financialRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;

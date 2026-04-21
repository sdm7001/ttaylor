import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// TODO: Replace with real appRouter import once services/api is built.
// import { appRouter } from '../../../../../../../services/api/src/root';
// import { createContext } from '../../../../../../../services/api/src/context';

// Placeholder router for scaffolding -- replace when API layer is implemented.
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.create({ transformer: superjson });
const appRouter = t.router({});

export type AppRouter = typeof appRouter;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };

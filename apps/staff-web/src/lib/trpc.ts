import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// TODO: Import the real AppRouter type from services/api once it is built.
// For now, define a placeholder type so the client wires up correctly.
// Replace this with: import type { AppRouter } from '../../../../services/api/src/root';
type AppRouter = Record<string, never>;

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
    ],
  });
}

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ttaylor/api';

export const trpc = createTRPCReact<AppRouter>();

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ttaylor/domain': path.resolve(__dirname, 'packages/domain/src'),
      '@ttaylor/workflows': path.resolve(__dirname, 'packages/workflows/src'),
      '@ttaylor/documents': path.resolve(__dirname, 'packages/documents/src'),
      '@ttaylor/auth': path.resolve(__dirname, 'packages/auth/src'),
      '@ttaylor/ui': path.resolve(__dirname, 'packages/ui/src'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**'],
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**', 'services/*/src/**'],
      exclude: ['**/*.test.ts', '**/index.ts'],
    },
  },
});

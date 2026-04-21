# Integration Tests

## Overview

Integration tests verify the behavior of Ttaylor platform modules working together, including database interactions, tRPC router logic, and cross-module workflows.

## Prerequisites

### Database

Integration tests require a real PostgreSQL database. Set the `DATABASE_URL` environment variable to point to a test database:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/ttaylor_test"
```

**Important:** Use a dedicated test database, not your development or production database. The tests create and destroy data during execution.

### Authentication

Tests use Clerk test keys for authentication context:

```bash
export CLERK_SECRET_KEY="sk_test_..."
```

### Prisma Setup

Before running integration tests for the first time, ensure the test database schema is up to date:

```bash
npx prisma db push --schema=database/schema/schema.prisma
```

## Test Pattern

Each integration test file follows the **transaction rollback** pattern:

1. A Prisma transaction is started in `beforeEach`
2. All test operations run inside that transaction
3. The transaction is rolled back in `afterEach`, leaving the database unchanged

This ensures test isolation without needing to manually clean up seed data.

```typescript
let tx: PrismaTransaction;

beforeEach(async () => {
  tx = await prisma.$transaction.start();
});

afterEach(async () => {
  await tx.$rollback();
});
```

**Note:** For the mocked integration tests (like `matters.test.ts`), the Prisma client is mocked with `vitest-mock-extended` and no real database is required.

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run a specific integration test
npx vitest run tests/integration/matters.test.ts
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for DB tests) | PostgreSQL connection string for test database |
| `CLERK_SECRET_KEY` | Yes (for auth tests) | Clerk test-mode secret key |

## Directory Structure

```
tests/integration/
  README.md          -- This file
  matters.test.ts    -- Matter CRUD and status transition tests (mocked Prisma)
```

## Writing New Integration Tests

1. Create a new `.test.ts` file in this directory
2. Use the transaction rollback pattern for database isolation
3. Mock external services (Clerk, email) to avoid side effects
4. Use fixed test data, not random values, for deterministic tests
5. Clean up any created files or side effects in `afterEach`

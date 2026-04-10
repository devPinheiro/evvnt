import { beforeAll, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { resetDatabase } from './resetDb.js';

/**
 * Resets the database before each test when Postgres is reachable; otherwise `ready` stays false.
 * Use `if (!db.ready) return ctx.skip()` at the start of each integration test.
 */
export function integrationDbHooks(): { ready: boolean } {
  const state = { ready: false };

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      state.ready = true;
    } catch (err) {
      console.warn('[integration] PostgreSQL unavailable — skipping integration tests.', (err as Error).message);
      state.ready = false;
    }
    if (
      (process.env.REQUIRE_E2E_DB === '1' || process.env.REQUIRE_E2E_DB === 'true') &&
      !state.ready
    ) {
      throw new Error('REQUIRE_E2E_DB is set but PostgreSQL is not reachable.');
    }
  }, 30_000);

  beforeEach(async () => {
    if (state.ready) await resetDatabase();
  });

  return state;
}

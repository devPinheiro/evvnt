import { prisma } from '../../src/lib/prisma.js';

/** Wipes all application data (PostgreSQL). Safe for dedicated test DBs only. */
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "PaymentEvent", "Organisation" RESTART IDENTITY CASCADE;',
  );
}

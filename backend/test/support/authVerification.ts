import { prisma } from '../../src/lib/prisma.js';
import { hashOpaqueToken } from '../../src/modules/auth/tokenHash.js';

/** Inserts a known verification link token for E2E / integration tests. */
export async function insertKnownEmailVerificationToken(userId: string, rawToken: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId, consumedAt: null, targetEmail: null } });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(rawToken),
      targetEmail: null,
      expiresAt: new Date(Date.now() + 3600_000),
    },
  });
}

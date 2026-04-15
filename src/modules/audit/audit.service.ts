import { injectable } from 'inversify';

import { prisma } from '../../lib/prisma.js';

@injectable()
export class AuditService {
  async log(input: {
    organisationId: string;
    eventId?: string | null;
    actorUserId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: unknown;
  }) {
    await prisma.auditLog.create({
      data: {
        organisationId: input.organisationId,
        eventId: input.eventId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }
}


import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { integrationDbHooks } from '../support/integrationDb.js';
import { uniqueEmail } from '../support/helpers.js';

describe('AuditService (integration)', () => {
  const db = integrationDbHooks();

  it('persists an audit row', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const auth = new AuthService();
    const audit = new AuditService();
    const email = uniqueEmail('audit');
    const { organisation, user } = await auth.signup({ orgName: 'Audit Org', email, password: 'password1234' });

    await audit.log({
      organisationId: organisation.id,
      actorUserId: user.id,
      action: 'e2e.audit.test',
      entityType: 'test',
      entityId: 'ent-1',
      metadata: { n: 1 },
    });

    const rows = await prisma.auditLog.findMany({
      where: { organisationId: organisation.id, action: 'e2e.audit.test' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actorUserId).toBe(user.id);
  });
});

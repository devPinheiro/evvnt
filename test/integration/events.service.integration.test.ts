import { describe, it, expect } from 'vitest';
import { buildContainer } from '../../src/di/container.js';
import { TYPES } from '../../src/di/types.js';
import { integrationDbHooks } from '../support/integrationDb.js';
import { uniqueEmail } from '../support/helpers.js';

describe('EventsService (integration)', () => {
  const db = integrationDbHooks();

  it('creates an event with owner membership and reads it back', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const c = buildContainer();
    const auth = c.get(TYPES.AuthService);
    const events = c.get(TYPES.EventsService);

    const email = uniqueEmail('events');
    const { organisation, user } = await auth.signup({ orgName: 'Events Org', email, password: 'password1234' });

    const event = await events.create({
      orgId: organisation.id,
      actorUserId: user.id,
      name: 'Product Launch',
      timezone: 'Africa/Lagos',
    });

    expect(event.slug).toBeTruthy();
    expect(event.status).toBe('DRAFT');

    const again = await events.get(organisation.id, event.id);
    expect(again.name).toBe('Product Launch');

    const listed = await events.list(organisation.id);
    expect(listed.map((e: { id: string }) => e.id)).toContain(event.id);
  });
});

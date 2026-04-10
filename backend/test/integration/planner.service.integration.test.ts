import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/App.js';
import { prisma } from '../../src/lib/prisma.js';
import { integrationDbHooks } from '../support/integrationDb.js';
import { authHeader, futureIso, uniqueEmail } from '../support/helpers.js';

describe('Event Planner API (integration)', () => {
  const db = integrationDbHooks();
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('GET /planner returns defaults and KPIs; push-budget creates finance rows', async (ctx) => {
    if (!db.ready) return ctx.skip();

    const email = uniqueEmail('planner-api');
    const signup = await request(app)
      .post('/api/v1/auth/signup')
      .send({ orgName: 'P Org', email, password: 'password1234' })
      .expect(201);
    const token = signup.body.data.tokens.accessToken as string;
    const ev = await request(app)
      .post('/api/v1/events')
      .set(authHeader(token))
      .send({ name: 'Planner Event', startsAt: futureIso(48) })
      .expect(201);
    const eventId = ev.body.data.event.id as string;

    const get = await request(app).get(`/api/v1/events/${eventId}/planner`).set(authHeader(token)).expect(200);
    expect(get.body.ok).toBe(true);
    expect(get.body.data.hallState.hallLengthM).toBeGreaterThan(0);
    expect(get.body.data.cost).toBeDefined();
    expect(get.body.data.hall.ok).toBe(true);

    const push = await request(app)
      .post(`/api/v1/events/${eventId}/planner/push-budget`)
      .set(authHeader(token))
      .send({ mode: 'replace' })
      .expect(201);
    expect(push.body.data.createdCount).toBeGreaterThan(0);

    const entries = await prisma.financeEntry.findMany({
      where: { eventId },
    });
    expect(entries.length).toBeGreaterThan(0);
    const tagged = entries.filter((e) => (e.metadata as { source?: string } | null)?.source === 'planner_budget');
    expect(tagged.length).toBe(entries.length);
  });
});

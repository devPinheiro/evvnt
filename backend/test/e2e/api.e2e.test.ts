import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/App.js';
import { prisma } from '../../src/lib/prisma.js';
import { resetDatabase } from '../support/resetDb.js';
import { authHeader, futureIso, paystackSignature, signupUser, uniqueEmail } from '../support/helpers.js';
import { insertKnownEmailVerificationToken } from '../support/authVerification.js';

describe('E2E HTTP API', () => {
  describe('no database required', () => {
    const app = createApp();

    it('GET /health returns ok', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body).toEqual({ ok: true, data: { status: 'ok' } });
    });

    it('GET /api/openapi.json serves OpenAPI document', async () => {
      const res = await request(app).get('/api/openapi.json').expect(200);
      expect(res.body.openapi).toMatch(/^3\./);
      expect(res.body.paths).toBeDefined();
    });

    it('GET /api/v1/events without token returns 401', async () => {
      const res = await request(app).get('/api/v1/events').expect(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('unknown route returns 404 envelope', async () => {
      const res = await request(app).get('/api/v1/no-such-route').expect(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('with PostgreSQL', () => {
    let app: ReturnType<typeof createApp>;
    let dbOk = false;

    beforeAll(async () => {
      try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        dbOk = true;
      } catch (err) {
        console.warn(
          '[e2e] PostgreSQL unavailable — skipping DB tests. Set DATABASE_URL and run migrations. ',
          (err as Error).message,
        );
        dbOk = false;
      }
      if (
        (process.env.REQUIRE_E2E_DB === '1' || process.env.REQUIRE_E2E_DB === 'true') &&
        !dbOk
      ) {
        throw new Error(
          'REQUIRE_E2E_DB is set but PostgreSQL is not reachable. Start Postgres and apply migrations.',
        );
      }
    }, 30_000);

    beforeEach(async () => {
      if (!dbOk) return;
      await resetDatabase();
      app = createApp();
    });

    it('signup, me, login, refresh, logout', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const password = 'password1234';
      const email = uniqueEmail('auth');
      const signup = await request(app)
        .post('/api/v1/auth/signup')
        .send({ orgName: 'Auth Org', email, password, name: 'Auth User' })
        .expect(201);
      expect(signup.body.ok).toBe(true);
      expect(signup.body.data.user.emailVerified).toBe(false);
      const orgId = signup.body.data.organisation.id;
      const userId = signup.body.data.user.id as string;
      const access1 = signup.body.data.tokens.accessToken as string;
      const refresh = signup.body.data.tokens.refreshToken as string;

      const vt = `e2e-verify-${userId.slice(0, 12)}`;
      await insertKnownEmailVerificationToken(userId, vt);
      await request(app).post('/api/v1/auth/verify-email').send({ token: vt }).expect(200);

      const me = await request(app).get('/api/v1/auth/me').set(authHeader(access1)).expect(200);
      expect(me.body.data.user.email).toBe(email);
      expect(me.body.data.user.emailVerified).toBe(true);

      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ orgId, email, password })
        .expect(200);
      const access2 = login.body.data.tokens.accessToken as string;
      expect(access2).toBeTruthy();

      const refreshed = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refresh })
        .expect(200);
      expect(refreshed.body.ok).toBe(true);
      expect(refreshed.body.data.tokens?.accessToken).toBeTruthy();

      await request(app).post('/api/v1/auth/logout').send({ refreshToken: refresh }).expect(200);

      await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refresh }).expect(401);
    });

    it('creates, updates, publishes, cancels, clones events', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const startsAt = futureIso(72);

      const created = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Lagos Launch Party', startsAt, timezone: 'Africa/Lagos' })
        .expect(201);
      const eventId = created.body.data.event.id as string;
      expect(created.body.data.event.status).toBe('DRAFT');

      const listed = await request(app).get('/api/v1/events').set(authHeader(u.accessToken)).expect(200);
      expect(listed.body.data.events).toHaveLength(1);

      const got = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(got.body.data.event.id).toBe(eventId);

      await request(app)
        .put(`/api/v1/events/${eventId}`)
        .set(authHeader(u.accessToken))
        .send({ description: 'Updated via E2E' })
        .expect(200);

      const published = await request(app)
        .post(`/api/v1/events/${eventId}/publish`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(published.body.data.event.status).toBe('PUBLISHED');

      const draft2 = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'To Cancel', startsAt: futureIso(96) })
        .expect(201);
      const event2Id = draft2.body.data.event.id as string;
      const cancelled = await request(app)
        .post(`/api/v1/events/${event2Id}/cancel`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(cancelled.body.data.event.status).toBe('CANCELLED');

      const cloned = await request(app)
        .post(`/api/v1/events/${eventId}/clone`)
        .set(authHeader(u.accessToken))
        .send({ name: 'Cloned Party' })
        .expect(201);
      expect(cloned.body.data.event.name).toBe('Cloned Party');
      expect(cloned.body.data.event.status).toBe('DRAFT');
    });

    it('guests, invite, public RSVP', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Wedding', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      const guestRes = await request(app)
        .post(`/api/v1/events/${eventId}/guests`)
        .set(authHeader(u.accessToken))
        .send({ name: 'Guest One', email: uniqueEmail('guest') })
        .expect(201);
      const guestId = guestRes.body.data.guest.id as string;

      const list = await request(app)
        .get(`/api/v1/events/${eventId}/guests`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(list.body.data.guests).toHaveLength(1);

      await request(app)
        .post(`/api/v1/events/${eventId}/guests/dedupe-preview`)
        .set(authHeader(u.accessToken))
        .send({ candidates: [{ email: list.body.data.guests[0].email }] })
        .expect(200);

      await request(app)
        .post(`/api/v1/events/${eventId}/guests/invite-link`)
        .set(authHeader(u.accessToken))
        .send({})
        .expect(201);

      const inv = await request(app)
        .post(`/api/v1/events/${eventId}/guests/${guestId}/invite`)
        .set(authHeader(u.accessToken))
        .send({})
        .expect(201);
      const token = inv.body.data.invite.token as string;

      const rsvp = await request(app)
        .post(`/api/v1/rsvp/${token}`)
        .send({ status: 'RSVP_YES', guestName: 'Guest One' })
        .expect(200);
      expect(rsvp.body.ok).toBe(true);
    });

    it('ticketing: tier, checkout, Paystack webhook, scan, offline bundle', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const secret = process.env.PAYSTACK_SECRET_KEY!;
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Ticketed Event', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      const tierRes = await request(app)
        .post(`/api/v1/events/${eventId}/ticketing/tiers`)
        .set(authHeader(u.accessToken))
        .send({
          name: 'General',
          priceNgn: 5000,
          quantityTotal: 100,
          perOrderLimit: 10,
        })
        .expect(201);
      const tierId = tierRes.body.data.tier.id as string;

      const tiers = await request(app)
        .get(`/api/v1/events/${eventId}/ticketing/tiers`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(tiers.body.data.tiers).toHaveLength(1);

      const checkout = await request(app)
        .post(`/api/v1/events/${eventId}/ticketing/checkout`)
        .send({
          ticketTierId: tierId,
          quantity: 2,
          buyerEmail: uniqueEmail('buyer'),
        })
        .expect(201);
      const reference = checkout.body.data.paystack.reference as string;
      const amountKobo = checkout.body.data.paystack.amountKobo as number;

      const payload = {
        event: 'charge.success',
        data: { id: 9001001, reference, amount: amountKobo },
      };
      const raw = Buffer.from(JSON.stringify(payload), 'utf8');
      const sig = paystackSignature(raw, secret);
      const wh = await request(app)
        .post('/api/v1/payments/paystack/webhook')
        .set('Content-Type', 'application/json')
        .set('x-paystack-signature', sig)
        .send(raw)
        .expect(200);
      expect(wh.body.ok).toBe(true);

      const orderId = checkout.body.data.order.id as string;
      const tickets = await prisma.ticket.findMany({ where: { orderId } });
      expect(tickets).toHaveLength(2);

      const scan = await request(app)
        .post(`/api/v1/events/${eventId}/ticketing/scan`)
        .set(authHeader(u.accessToken))
        .send({ qrToken: tickets[0]!.qrToken })
        .expect(200);
      expect(scan.body.data.valid).toBe(true);

      const bundle = await request(app)
        .get(`/api/v1/events/${eventId}/ticketing/offline-bundle`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(bundle.body.data.tickets.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects Paystack webhook with bad signature', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Pay Test', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      const tierRes = await request(app)
        .post(`/api/v1/events/${eventId}/ticketing/tiers`)
        .set(authHeader(u.accessToken))
        .send({ name: 'VIP', priceNgn: 1000, quantityTotal: 10 })
        .expect(201);
      const tierId = tierRes.body.data.tier.id as string;

      const checkout = await request(app)
        .post(`/api/v1/events/${eventId}/ticketing/checkout`)
        .send({ ticketTierId: tierId, quantity: 1 })
        .expect(201);
      const reference = checkout.body.data.paystack.reference as string;
      const amountKobo = checkout.body.data.paystack.amountKobo as number;

      const raw = Buffer.from(
        JSON.stringify({
          event: 'charge.success',
          data: { id: 9001002, reference, amount: amountKobo },
        }),
        'utf8',
      );

      const res = await request(app)
        .post('/api/v1/payments/paystack/webhook')
        .set('Content-Type', 'application/json')
        .set('x-paystack-signature', 'deadbeef')
        .send(raw)
        .expect(401);
      expect(res.body.ok).toBe(false);
    });

    it('vendors, tasks, milestones, invoices, finance', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Vendor Event', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      const v = await request(app)
        .post(`/api/v1/events/${eventId}/vendors`)
        .set(authHeader(u.accessToken))
        .send({
          name: 'Cater Ltd',
          type: 'CATERING',
          agreedFeeNgn: 500_000,
          email: uniqueEmail('vendor'),
        })
        .expect(201);
      const vendorId = v.body.data.vendor.id as string;

      const vendors = await request(app)
        .get(`/api/v1/events/${eventId}/vendors`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(vendors.body.data.vendors).toHaveLength(1);

      await request(app)
        .post(`/api/v1/events/${eventId}/vendors/${vendorId}/tasks`)
        .set(authHeader(u.accessToken))
        .send({ title: 'Tasting' })
        .expect(201);

      await request(app)
        .post(`/api/v1/events/${eventId}/vendors/${vendorId}/milestones`)
        .set(authHeader(u.accessToken))
        .send({ title: 'Deposit', amountNgn: 100_000 })
        .expect(201);

      await request(app)
        .post(`/api/v1/events/${eventId}/vendors/${vendorId}/invoices`)
        .set(authHeader(u.accessToken))
        .send({ amountNgn: 200_000, note: 'Invoice 1' })
        .expect(201);

      await request(app)
        .post(`/api/v1/events/${eventId}/finance/expense`)
        .set(authHeader(u.accessToken))
        .send({ amountNgn: 25_000, category: 'Transport' })
        .expect(201);

      const ledger = await request(app)
        .get(`/api/v1/events/${eventId}/finance/ledger`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(ledger.body.data.entries.length).toBeGreaterThanOrEqual(1);
    });

    it('gifts and gallery', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Gift & Gallery', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      await request(app)
        .put(`/api/v1/events/${eventId}/gifts/settings`)
        .set(authHeader(u.accessToken))
        .send({ isEnabled: true, pageMessage: 'Thanks!' })
        .expect(200);

      const giftCo = await request(app)
        .post(`/api/v1/events/${eventId}/gifts/checkout`)
        .send({ amountNgn: 5000, senderName: 'Friend' })
        .expect(201);
      expect(giftCo.body.ok).toBe(true);

      const giftLedger = await request(app)
        .get(`/api/v1/events/${eventId}/gifts/ledger`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(giftLedger.body.data.gifts.length).toBeGreaterThanOrEqual(1);

      await request(app)
        .post(`/api/v1/events/${eventId}/gifts/payouts`)
        .set(authHeader(u.accessToken))
        .send({ amountNgn: 10_000 })
        .expect(201);

      await request(app)
        .put(`/api/v1/events/${eventId}/gallery/settings`)
        .set(authHeader(u.accessToken))
        .send({ guestUploadEnabled: true, visibility: 'GUEST_ONLY' })
        .expect(200);

      const asset = await request(app)
        .post(`/api/v1/events/${eventId}/gallery/assets`)
        .set(authHeader(u.accessToken))
        .send({
          sourceUrl: 'https://example.com/photo.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        })
        .expect(201);
      const assetId = asset.body.data.asset.id as string;

      const assets = await request(app)
        .get(`/api/v1/events/${eventId}/gallery/assets`)
        .set(authHeader(u.accessToken))
        .expect(200);
      expect(assets.body.data.assets).toHaveLength(1);

      await request(app)
        .post(`/api/v1/events/${eventId}/gallery/assets/${assetId}/approve`)
        .set(authHeader(u.accessToken))
        .expect(200);
    });

    it('notifications list and mark-read', async (ctx) => {
      if (!dbOk) return ctx.skip();
      const u = await signupUser(app);
      const ev = await request(app)
        .post('/api/v1/events')
        .set(authHeader(u.accessToken))
        .send({ name: 'Notif Event', startsAt: futureIso(48) })
        .expect(201);
      const eventId = ev.body.data.event.id as string;

      await request(app)
        .post(`/api/v1/events/${eventId}/publish`)
        .set(authHeader(u.accessToken))
        .expect(200);

      const list = await request(app).get('/api/v1/notifications').set(authHeader(u.accessToken)).expect(200);
      expect(list.body.data.notifications.length).toBeGreaterThanOrEqual(1);
      const n0 = list.body.data.notifications[0];
      expect(n0.id).toBeTruthy();

      const marked = await request(app)
        .post('/api/v1/notifications/mark-read')
        .set(authHeader(u.accessToken))
        .send({ notificationIds: [n0.id] })
        .expect(200);
      expect(marked.body.data.updatedCount).toBeGreaterThanOrEqual(1);
    });
  });
});

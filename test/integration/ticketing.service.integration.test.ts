import { describe, it, expect } from 'vitest';
import { buildContainer } from '../../src/di/container.js';
import { TYPES } from '../../src/di/types.js';
import { integrationDbHooks } from '../support/integrationDb.js';
import { uniqueEmail } from '../support/helpers.js';

describe('TicketingService (integration)', () => {
  const db = integrationDbHooks();

  it('creates a tier and a checkout order with Paystack reference', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const c = buildContainer();
    const auth = c.get(TYPES.AuthService);
    const events = c.get(TYPES.EventsService);
    const ticketing = c.get(TYPES.TicketingService);

    const email = uniqueEmail('tix');
    const { organisation, user } = await auth.signup({ orgName: 'Tix Org', email, password: 'password1234' });
    const event = await events.create({
      orgId: organisation.id,
      actorUserId: user.id,
      name: 'Concert',
    });

    const tier = await ticketing.createTier({
      orgId: organisation.id,
      actorUserId: user.id,
      eventId: event.id,
      name: 'GA',
      priceNgn: 2500,
      quantityTotal: 100,
    });

    const checkout = await ticketing.createCheckout({
      eventId: event.id,
      ticketTierId: tier.id,
      quantity: 2,
      buyerEmail: uniqueEmail('buyer'),
    });

    expect(checkout.order.status).toBe('INITIATED');
    expect(checkout.order.paystackRef).toMatch(/^evvnt_/);
    expect(checkout.paystack.amountNgn).toBe(5000);

    const tiers = await ticketing.listTiers(organisation.id, event.id);
    expect(tiers).toHaveLength(1);
  });
});

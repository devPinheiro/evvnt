import { Router } from 'express';
import { ok } from '../../http/response.js';
import { verifyPaystackSignature } from './paystack.webhook.js';
import { prisma } from '../../lib/prisma.js';
import { PaymentProvider } from '@prisma/client';
import { TicketingService } from '../ticketing/ticketing.service.js';

type PaystackWebhookBody = {
  event: string;
  data?: { id?: number };
};

export function buildPaymentsRouter(ticketing: TicketingService) {
  const router = Router();

  // Paystack sends JSON. We must verify signature using the raw body bytes.
  router.post('/paystack/webhook', async (req, res, next) => {
    try {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (!rawBody) {
        throw new Error('Raw body missing');
      }

      verifyPaystackSignature(rawBody, req.header('x-paystack-signature') ?? undefined);

      const body = req.body as PaystackWebhookBody;
      const providerEventId = body?.data?.id;
      if (!providerEventId) {
        // Still acknowledge to avoid retries storms, but we don't store.
        res.json(ok({ received: true }));
        return;
      }

      // Idempotent insert: unique(provider, providerEventId)
      const eventRow = await prisma.paymentEvent.upsert({
        where: {
          provider_providerEventId: { provider: PaymentProvider.PAYSTACK, providerEventId: String(providerEventId) },
        },
        update: {},
        create: {
          provider: PaymentProvider.PAYSTACK,
          providerEventId: String(providerEventId),
          type: body.event ?? 'unknown',
          payload: body as any,
        },
      });

      // Business handling (MVP): issue tickets on successful charge
      // Paystack `charge.success` typically includes `data.reference` and `data.amount` (kobo).
      if (eventRow.type === 'charge.success') {
        const payload = eventRow.payload as any;
        const reference: string | undefined = payload?.data?.reference;
        const amountKobo: number | undefined = payload?.data?.amount;
        if (reference) {
          await ticketing.handlePaystackChargeSuccess({
            providerEventId: eventRow.providerEventId,
            reference,
            amountKobo: typeof amountKobo === 'number' ? amountKobo : null,
          });
        }
      }

      res.json(ok({ received: true }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}


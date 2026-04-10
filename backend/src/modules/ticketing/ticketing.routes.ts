import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole } from '@prisma/client';
import { TicketingService } from './ticketing.service.js';

export function buildTicketingRouter(service: TicketingService) {
  const router = Router();

  // Public checkout for guests (no auth)
  router.post('/checkout', async (req, res, next) => {
    try {
      const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
      const body = z
        .object({
          ticketTierId: z.string().min(1),
          quantity: z.number().int().min(1).max(50),
          buyerEmail: z.string().email().optional(),
          buyerPhone: z.string().min(6).optional(),
        })
        .parse(req.body);

      const result = await service.createCheckout({
        eventId,
        ticketTierId: body.ticketTierId,
        quantity: body.quantity,
        buyerEmail: body.buyerEmail ?? null,
        buyerPhone: body.buyerPhone ?? null,
      });

      res.status(201).json(ok(result));
    } catch (err) {
      next(err);
    }
  });

  // Host/Co-host manage tiers
  router.use(requireAuth);

  router.get(
    '/tiers',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const tiers = await service.listTiers(auth.orgId, eventId);
        res.json(ok({ tiers }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/tiers',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            name: z.string().min(2),
            description: z.string().optional(),
            priceNgn: z.number().int().min(0).max(100000000),
            quantityTotal: z.number().int().min(1).max(1000000),
            saleStartsAt: z.string().datetime().optional(),
            saleEndsAt: z.string().datetime().optional(),
            perOrderLimit: z.number().int().min(1).max(50).optional(),
          })
          .parse(req.body);

        const tier = await service.createTier({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          name: body.name,
          description: body.description ?? null,
          priceNgn: body.priceNgn,
          quantityTotal: body.quantityTotal,
          saleStartsAt: body.saleStartsAt ? new Date(body.saleStartsAt) : null,
          saleEndsAt: body.saleEndsAt ? new Date(body.saleEndsAt) : null,
          perOrderLimit: body.perOrderLimit ?? null,
        });

        res.status(201).json(ok({ tier }));
      } catch (err) {
        next(err);
      }
    },
  );

  // Staff scan
  router.post(
    '/scan',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST, EventRole.STAFF] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z.object({ qrToken: z.string().min(8) }).parse(req.body);
        const result = await service.scan({ orgId: auth.orgId, actorUserId: auth.userId, eventId, qrToken: body.qrToken });
        res.json(ok(result));
      } catch (err) {
        next(err);
      }
    },
  );

  // Offline bundle for scanner preload (auth required)
  router.get(
    '/offline-bundle',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST, EventRole.STAFF] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const result = await service.offlineBundle({ orgId: auth.orgId, eventId });
        res.json(ok(result));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


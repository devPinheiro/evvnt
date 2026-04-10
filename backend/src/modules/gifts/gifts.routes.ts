import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole } from '@prisma/client';
import { GiftsService } from './gifts.service.js';

export function buildGiftsRouter(service: GiftsService) {
  const router = Router();

  // Public: gift checkout (Paystack reference)
  router.post('/checkout', async (req, res, next) => {
    try {
      const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
      const body = z
        .object({
          amountNgn: z.number().int().min(500).max(500_000),
          senderName: z.string().min(1).optional(),
          senderEmail: z.string().email().optional(),
          senderPhone: z.string().min(6).optional(),
          isAnonymous: z.boolean().optional(),
          message: z.string().max(280).optional(),
        })
        .parse(req.body);

      const result = await service.createGiftCheckout({
        eventId,
        amountNgn: body.amountNgn,
        senderName: body.senderName ?? null,
        senderEmail: body.senderEmail ?? null,
        senderPhone: body.senderPhone ?? null,
        isAnonymous: body.isAnonymous ?? false,
        message: body.message ?? null,
      });

      res.status(201).json(ok(result));
    } catch (err) {
      next(err);
    }
  });

  // Authenticated host controls
  router.use(requireAuth);

  router.put(
    '/settings',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            isEnabled: z.boolean(),
            hostDisplayName: z.string().optional(),
            hostPhotoUrl: z.string().url().optional(),
            pageMessage: z.string().max(1000).optional(),
            suggestedAmounts: z.array(z.number().int().min(0).max(500_000)).max(10).optional(),
          })
          .parse(req.body);

        const settings = await service.upsertSettings({
          orgId: auth.orgId,
          eventId,
          isEnabled: body.isEnabled,
          hostDisplayName: body.hostDisplayName ?? null,
          hostPhotoUrl: body.hostPhotoUrl ?? null,
          pageMessage: body.pageMessage ?? null,
          suggestedAmounts: body.suggestedAmounts ?? [],
        });

        res.json(ok({ settings }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/ledger',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const gifts = await service.listGifts(auth.orgId, eventId);
        res.json(ok({ gifts }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/payouts',
    requireEventRole({ roles: [EventRole.OWNER] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z.object({ amountNgn: z.number().int().min(1000).max(1_000_000_000) }).parse(req.body);
        const payout = await service.requestPayout(auth.orgId, eventId, body.amountNgn);
        res.status(201).json(ok({ payout }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


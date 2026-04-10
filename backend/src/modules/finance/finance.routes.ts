import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export function buildFinanceRouter() {
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/ledger',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const entries = await prisma.financeEntry.findMany({
          where: { eventId, event: { organisationId: auth.orgId } },
          orderBy: { createdAt: 'desc' },
        });
        res.json(ok({ entries }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/expense',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            category: z.string().min(1).optional(),
            amountNgn: z.number().int().min(0).max(1_000_000_000),
            description: z.string().max(1000).optional(),
          })
          .parse(req.body);
        const entry = await prisma.financeEntry.create({
          data: {
            eventId,
            type: 'EXPENSE',
            status: 'LOGGED',
            category: body.category ?? 'Misc',
            amountNgn: body.amountNgn,
            description: body.description ?? null,
          },
        });
        res.status(201).json(ok({ entry }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


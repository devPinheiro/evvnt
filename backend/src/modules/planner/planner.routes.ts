import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole } from '@prisma/client';
import { PlannerService } from './planner.service.js';
import { CostStateSchema, HallStateSchema } from './planner.schemas.js';

export function buildPlannerRouter(service: PlannerService) {
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const data = await service.getSnapshot({ orgId: auth.orgId, eventId });
        res.json(ok(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    '/',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            hallState: HallStateSchema,
            costState: CostStateSchema,
          })
          .parse(req.body);

        const data = await service.saveState({
          orgId: auth.orgId,
          eventId,
          actorUserId: auth.userId,
          hallState: body.hallState,
          costState: body.costState,
        });
        res.json(ok(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/push-budget',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            mode: z.enum(['merge', 'replace']).default('merge'),
          })
          .parse(req.body ?? {});

        const data = await service.pushBudget({
          orgId: auth.orgId,
          eventId,
          actorUserId: auth.userId,
          mode: body.mode,
        });
        res.status(201).json(ok(data));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

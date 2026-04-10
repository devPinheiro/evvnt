import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { prisma } from '../../lib/prisma.js';

export function buildNotificationsRouter() {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const auth = req.auth!;
      const list = await prisma.notification.findMany({
        where: { userId: auth.userId, organisationId: auth.orgId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json(ok({ notifications: list }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/mark-read', async (req, res, next) => {
    try {
      const auth = req.auth!;
      const body = z.object({ notificationIds: z.array(z.string().min(1)).min(1).max(100) }).parse(req.body);
      const updated = await prisma.notification.updateMany({
        where: { id: { in: body.notificationIds }, userId: auth.userId, organisationId: auth.orgId, readAt: null },
        data: { readAt: new Date() },
      });
      res.json(ok({ updatedCount: updated.count }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}


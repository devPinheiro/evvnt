import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole, VendorType } from '@prisma/client';
import { VendorsService } from './vendors.service.js';

export function buildVendorsRouter(service: VendorsService) {
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const vendors = await service.list(auth.orgId, eventId);
        res.json(ok({ vendors }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            name: z.string().min(1),
            type: z.nativeEnum(VendorType),
            email: z.string().email().optional(),
            phone: z.string().min(6).optional(),
            agreedFeeNgn: z.number().int().min(0).max(1_000_000_000),
          })
          .parse(req.body);

        const vendor = await service.addVendor({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          name: body.name,
          type: body.type,
          email: body.email ?? null,
          phone: body.phone ?? null,
          agreedFeeNgn: body.agreedFeeNgn,
        });
        res.status(201).json(ok({ vendor }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:vendorId/tasks',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId, vendorId } = z
          .object({ eventId: z.string().min(1), vendorId: z.string().min(1) })
          .parse(req.params as any);
        const body = z
          .object({
            title: z.string().min(1),
            description: z.string().optional(),
            dueAt: z.string().datetime().optional(),
          })
          .parse(req.body);
        const task = await service.addTask({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          vendorId,
          title: body.title,
          description: body.description ?? null,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
        });
        res.status(201).json(ok({ task }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:vendorId/milestones',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId, vendorId } = z
          .object({ eventId: z.string().min(1), vendorId: z.string().min(1) })
          .parse(req.params as any);
        const body = z
          .object({
            title: z.string().min(1),
            amountNgn: z.number().int().min(0).max(1_000_000_000),
            dueAt: z.string().datetime().optional(),
          })
          .parse(req.body);
        const milestone = await service.addMilestone({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          vendorId,
          title: body.title,
          amountNgn: body.amountNgn,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
        });
        res.status(201).json(ok({ milestone }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:vendorId/invoices',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId, vendorId } = z
          .object({ eventId: z.string().min(1), vendorId: z.string().min(1) })
          .parse(req.params as any);
        const body = z
          .object({
            amountNgn: z.number().int().min(0).max(1_000_000_000),
            note: z.string().max(1000).optional(),
          })
          .parse(req.body);
        const invoice = await service.submitInvoice({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          vendorId,
          amountNgn: body.amountNgn,
          note: body.note ?? null,
        });
        res.status(201).json(ok({ invoice }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { GuestsService } from './guests.service.js';
import { EventRole, RsvpStatus } from '@prisma/client';

export function buildGuestsRouter(guests: GuestsService) {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.get(
    '/',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST, EventRole.STAFF] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const eventId = z.string().min(1).parse(req.params.eventId);
        const data = await guests.list(eventId, auth.orgId);
        res.json(ok({ guests: data }));
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
        const eventId = z.string().min(1).parse(req.params.eventId);
        const body = z
          .object({
            name: z.string().min(1),
            email: z.string().email().optional(),
            phone: z.string().min(6).optional(),
            groups: z.array(z.string().min(1)).optional(),
            plusOnes: z.number().int().min(0).max(20).optional(),
            tableNo: z.string().min(1).optional(),
            notes: z.string().max(500).optional(),
          })
          .parse(req.body);

        const guest = await guests.addGuest({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          name: body.name,
          email: body.email ?? null,
          phone: body.phone ?? null,
          groups: body.groups ?? [],
          plusOnes: body.plusOnes ?? 0,
          tableNo: body.tableNo ?? null,
          notes: body.notes ?? null,
        });

        res.status(201).json(ok({ guest }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/dedupe-preview',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const eventId = z.string().min(1).parse(req.params.eventId);
        const body = z
          .object({
            candidates: z.array(
              z.object({
                email: z.string().email().optional(),
                phone: z.string().min(6).optional(),
              }),
            ),
          })
          .parse(req.body);

        const result = await guests.dedupePreview({ eventId, orgId: auth.orgId, candidates: body.candidates });
        res.json(ok(result));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:guestId/invite',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const eventId = z.string().min(1).parse(req.params.eventId);
        const guestId = z.string().min(1).parse(req.params.guestId);
        const body = z.object({ channel: z.string().optional() }).parse(req.body ?? {});

        const result = await guests.createInvite({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          guestId,
          channel: body.channel ?? null,
        });

        res.status(201).json(ok(result));
      } catch (err) {
        next(err);
      }
    },
  );

  // General invite link (no guest)
  router.post(
    '/invite-link',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const eventId = z.string().min(1).parse(req.params.eventId);
        const body = z.object({ channel: z.string().optional() }).parse(req.body ?? {});

        const result = await guests.createInvite({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId,
          guestId: null,
          channel: body.channel ?? 'share',
        });

        res.status(201).json(ok(result));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

export function buildPublicRsvpRouter(guests: GuestsService) {
  const router = Router();

  router.post('/:token', async (req, res, next) => {
    try {
      const token = z.string().min(1).parse(req.params.token);
      const body = z
        .object({
          status: z.enum([RsvpStatus.RSVP_YES, RsvpStatus.RSVP_NO, RsvpStatus.RSVP_MAYBE]),
          guestName: z.string().min(1).optional(),
          guestEmail: z.string().email().optional(),
          guestPhone: z.string().min(6).optional(),
          message: z.string().max(280).optional(),
          plusOnes: z.number().int().min(0).max(20).optional(),
        })
        .parse(req.body);

      const result = await guests.rsvpSubmit({
        token,
        status: body.status,
        guestName: body.guestName ?? null,
        guestEmail: body.guestEmail ?? null,
        guestPhone: body.guestPhone ?? null,
        message: body.message ?? null,
        plusOnes: body.plusOnes ?? 0,
      });

      res.json(ok(result));
    } catch (err) {
      next(err);
    }
  });

  return router;
}


import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventsService } from './events.service.js';
import { EventRole } from '@prisma/client';

export function buildEventsRouter(events: EventsService) {
  const router = Router();

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const auth = req.auth!;
      const data = await events.list(auth.orgId);
      res.json(ok({ events: data }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const auth = req.auth!;
      const body = z
        .object({
          name: z.string().min(2),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          coverImageUrl: z.string().url().optional(),
          startsAt: z.string().datetime().optional(),
          endsAt: z.string().datetime().optional(),
          timezone: z.string().optional(),
          location: z.string().optional(),
          isOnline: z.boolean().optional(),
        })
        .parse(req.body);

      const event = await events.create({
        orgId: auth.orgId,
        actorUserId: auth.userId,
        name: body.name,
        slug: body.slug ?? null,
        description: body.description ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        timezone: body.timezone ?? null,
        location: body.location ?? null,
        isOnline: body.isOnline ?? false,
      });

      res.status(201).json(ok({ event }));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:eventId', async (req, res, next) => {
    try {
      const auth = req.auth!;
      const eventId = z.string().min(1).parse(req.params.eventId);
      const event = await events.get(auth.orgId, eventId);
      res.json(ok({ event }));
    } catch (err) {
      next(err);
    }
  });

  router.put(
    '/:eventId',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const body = z
          .object({
            name: z.string().min(2).optional(),
            description: z.string().optional(),
            coverImageUrl: z.string().url().optional(),
            startsAt: z.string().datetime().optional(),
            endsAt: z.string().datetime().optional(),
            timezone: z.string().optional(),
            location: z.string().optional(),
            isOnline: z.boolean().optional(),
          })
          .parse(req.body);

        const event = await events.update({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId: z.string().min(1).parse(req.params.eventId),
          name: body.name ?? null,
          description: body.description ?? null,
          coverImageUrl: body.coverImageUrl ?? null,
          startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
          endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
          timezone: body.timezone ?? null,
          location: body.location ?? null,
          isOnline: body.isOnline ?? null,
        });

        res.json(ok({ event }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:eventId/publish',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const event = await events.publish({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId: z.string().min(1).parse(req.params.eventId),
        });
        res.json(ok({ event }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:eventId/cancel',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const event = await events.cancel({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          eventId: z.string().min(1).parse(req.params.eventId),
        });
        res.json(ok({ event }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:eventId/clone',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const body = z
          .object({
            name: z.string().min(2).optional(),
            slug: z.string().min(1).optional(),
            startsAt: z.string().datetime().optional(),
            endsAt: z.string().datetime().optional(),
          })
          .parse(req.body ?? {});

        const event = await events.clone({
          orgId: auth.orgId,
          actorUserId: auth.userId,
          sourceEventId: z.string().min(1).parse(req.params.eventId),
          name: body.name ?? null,
          slug: body.slug ?? null,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
        });

        res.status(201).json(ok({ event }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


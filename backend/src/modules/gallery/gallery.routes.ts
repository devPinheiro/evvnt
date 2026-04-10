import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../http/response.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../auth/requireAuth.js';
import { requireEventRole } from '../auth/requireEventRole.js';
import { EventRole, GalleryVisibility } from '@prisma/client';

export function buildGalleryRouter() {
  const router = Router();

  // Public-ish upload intent (guest upload) could be added later.
  // For MVP skeleton we keep uploads behind auth.
  router.use(requireAuth);

  router.put(
    '/settings',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            guestUploadEnabled: z.boolean().optional(),
            approvalRequired: z.boolean().optional(),
            watermarkEnabled: z.boolean().optional(),
            visibility: z.nativeEnum(GalleryVisibility).optional(),
          })
          .parse(req.body);

        const settings = await prisma.gallerySettings.upsert({
          where: { eventId },
          update: {
            guestUploadEnabled: body.guestUploadEnabled ?? undefined,
            approvalRequired: body.approvalRequired ?? undefined,
            watermarkEnabled: body.watermarkEnabled ?? undefined,
            visibility: body.visibility ?? undefined,
          },
          create: {
            eventId,
            guestUploadEnabled: body.guestUploadEnabled ?? false,
            approvalRequired: body.approvalRequired ?? true,
            watermarkEnabled: body.watermarkEnabled ?? true,
            visibility: body.visibility ?? GalleryVisibility.GUEST_ONLY,
          },
        });

        res.json(ok({ settings }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/assets',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const body = z
          .object({
            sourceUrl: z.string().url(),
            thumbnailUrl: z.string().url().optional(),
            metadata: z.record(z.string(), z.any()).optional(),
          })
          .parse(req.body);

        const asset = await prisma.galleryAsset.create({
          data: {
            eventId,
            uploadedBy: auth.userId,
            sourceUrl: body.sourceUrl,
            thumbnailUrl: body.thumbnailUrl ?? null,
            metadata: (body.metadata as any) ?? undefined,
          },
        });

        res.status(201).json(ok({ asset }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/assets/:assetId/approve',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId, assetId } = z
          .object({ eventId: z.string().min(1), assetId: z.string().min(1) })
          .parse(req.params as any);

        const asset = await prisma.galleryAsset.update({
          where: { id: assetId },
          data: { isApproved: true, approvedAt: new Date() },
        });

        res.json(ok({ asset, approvedByUserId: auth.userId, eventId }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/assets',
    requireEventRole({ roles: [EventRole.OWNER, EventRole.CO_HOST] }),
    async (req, res, next) => {
      try {
        const auth = req.auth!;
        const { eventId } = z.object({ eventId: z.string().min(1) }).parse(req.params as any);
        const assets = await prisma.galleryAsset.findMany({
          where: { eventId, event: { organisationId: auth.orgId } },
          orderBy: { createdAt: 'desc' },
        });
        res.json(ok({ assets }));
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}


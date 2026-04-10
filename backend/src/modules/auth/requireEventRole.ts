import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../http/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { EventRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      eventAuth?: { eventId: string; role: EventRole; permissionsJson: unknown | null };
    }
  }
}

export function requireEventRole(opts: { param?: string; roles: EventRole[] }) {
  const param = opts.param ?? 'eventId';

  return async function requireEventRoleMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
      const auth = req.auth;
      if (!auth) {
        next(new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Missing auth context' }));
        return;
      }

      const eventId = (req.params as Record<string, string | undefined>)[param];
      if (!eventId) {
        next(new AppError({ status: 400, code: 'BAD_REQUEST', message: `Missing route param: ${param}` }));
        return;
      }

      const membership = await prisma.eventMembership.findFirst({
        where: { eventId, userId: auth.userId, event: { organisationId: auth.orgId } },
        select: { role: true, permissionsJson: true },
      });

      if (!membership) {
        next(new AppError({ status: 403, code: 'FORBIDDEN', message: 'Not a member of this event' }));
        return;
      }

      if (!opts.roles.includes(membership.role)) {
        next(new AppError({ status: 403, code: 'FORBIDDEN', message: 'Insufficient event role' }));
        return;
      }

      req.eventAuth = { eventId, role: membership.role, permissionsJson: membership.permissionsJson };
      next();
    } catch (err) {
      next(err);
    }
  };
}


import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../http/errors.js';
import { verifyJwt } from './jwt.js';

export type AuthContext = { userId: string; orgId: string };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    next(new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Missing bearer token' }));
    return;
  }

  try {
    const token = match[1];
    if (!token) throw new Error('Missing token');

    const payload = verifyJwt(token);
    if (payload.kind !== 'access') {
      throw new Error('Not an access token');
    }
    req.auth = { userId: payload.sub, orgId: payload.orgId };
    next();
  } catch {
    next(new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Invalid token' }));
  }
}


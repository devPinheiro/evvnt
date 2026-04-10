import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { JwtKind } from './auth.types.js';

type JwtPayload = {
  sub: string;
  orgId: string;
  kind: JwtKind;
};

export function signJwt(kind: JwtKind, payload: Omit<JwtPayload, 'kind'>) {
  const secret = kind === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
  const ttlSeconds = kind === 'access' ? env.JWT_ACCESS_TTL_SECONDS : env.JWT_REFRESH_TTL_SECONDS;

  return jwt.sign({ ...payload, kind }, secret, { expiresIn: ttlSeconds });
}

export function verifyJwt(token: string): JwtPayload {
  // Try access secret first; if it fails, try refresh secret.
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }
}


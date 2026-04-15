import crypto from 'crypto';
import type { Express } from 'express';
import request from 'supertest';
import { insertKnownEmailVerificationToken } from './authVerification.js';

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function signupUser(app: Express, opts?: { orgName?: string; email?: string; password?: string }) {
  const email = opts?.email ?? uniqueEmail('user');
  const password = opts?.password ?? 'password1234';
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      orgName: opts?.orgName ?? 'E2E Organisation',
      email,
      password,
      name: 'E2E Tester',
    })
    .expect(201);

  if (!res.body.ok) throw new Error('signup failed');
  const { organisation, user, tokens } = res.body.data;
  const userId = user.id as string;
  const rawToken = `e2e-verify-${userId.slice(0, 12)}`;
  await insertKnownEmailVerificationToken(userId, rawToken);
  await request(app).post('/api/v1/auth/verify-email').send({ token: rawToken }).expect(200);

  return {
    orgId: organisation.id as string,
    userId,
    email,
    password,
    accessToken: tokens.accessToken as string,
    refreshToken: tokens.refreshToken as string,
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function paystackSignature(rawBody: Buffer, secret: string) {
  return crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
}

export function futureIso(hoursAhead = 48) {
  return new Date(Date.now() + hoursAhead * 3600_000).toISOString();
}

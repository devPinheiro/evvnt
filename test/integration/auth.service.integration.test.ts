import { describe, it, expect } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { verifyJwt } from '../../src/modules/auth/jwt.js';
import { integrationDbHooks } from '../support/integrationDb.js';
import { uniqueEmail } from '../support/helpers.js';
import { insertKnownEmailVerificationToken } from '../support/authVerification.js';

describe('AuthService (integration)', () => {
  const db = integrationDbHooks();

  it('signup stores user and returns verifiable tokens', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const auth = new AuthService();
    const email = uniqueEmail('int-signup');
    const out = await auth.signup({ orgName: 'Integration Org', email, password: 'password1234' });
    expect(out.user.email).toBe(email);
    expect(verifyJwt(out.tokens.accessToken).kind).toBe('access');
    expect(verifyJwt(out.tokens.refreshToken).kind).toBe('refresh');
  });

  it('login succeeds after signup', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const auth = new AuthService();
    const email = uniqueEmail('int-login');
    const { organisation, user } = await auth.signup({ orgName: 'Org L', email, password: 'password1234' });
    const vt = `int-vt-${user.id.slice(0, 10)}`;
    await insertKnownEmailVerificationToken(user.id, vt);
    await auth.verifyEmailWithToken(vt);
    const out = await auth.login({ orgId: organisation.id, email, password: 'password1234' });
    expect(out.user.email).toBe(email);
  });

  it('refresh rotates refresh token (old token invalid after refresh)', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const auth = new AuthService();
    const email = uniqueEmail('int-ref');
    const { tokens } = await auth.signup({ orgName: 'Org R', email, password: 'password1234' });
    const next = await auth.refresh({ refreshToken: tokens.refreshToken });
    expect(next.tokens.refreshToken).toBeTruthy();
    await expect(auth.refresh({ refreshToken: tokens.refreshToken })).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('logout revokes refresh token', async (ctx) => {
    if (!db.ready) return ctx.skip();
    const auth = new AuthService();
    const email = uniqueEmail('int-out');
    const { tokens } = await auth.signup({ orgName: 'Org O', email, password: 'password1234' });
    await auth.logout({ refreshToken: tokens.refreshToken });
    await expect(auth.refresh({ refreshToken: tokens.refreshToken })).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });
});

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signJwt, verifyJwt } from '../../src/modules/auth/jwt.js';
import { env } from '../../src/config/env.js';

describe('jwt', () => {
  it('round-trips access tokens with correct kind', () => {
    const token = signJwt('access', { sub: 'user-1', orgId: 'org-1' });
    const payload = verifyJwt(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.orgId).toBe('org-1');
    expect(payload.kind).toBe('access');
  });

  it('round-trips refresh tokens', () => {
    const token = signJwt('refresh', { sub: 'user-2', orgId: 'org-2' });
    const payload = verifyJwt(token);
    expect(payload.kind).toBe('refresh');
  });

  it('rejects tampered tokens', () => {
    const token = signJwt('access', { sub: 'u', orgId: 'o' });
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    const tampered = `${parts[0]}.${parts[1]}!`;
    expect(() => verifyJwt(tampered)).toThrow();
  });

  it('verifyJwt accepts token signed with refresh secret', () => {
    const token = jwt.sign(
      { sub: 'u', orgId: 'o', kind: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: 60 },
    );
    const payload = verifyJwt(token);
    expect(payload.kind).toBe('refresh');
  });
});

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { env } from '../../src/config/env.js';
import { verifyPaystackSignature } from '../../src/modules/payments/paystack.webhook.js';
import { AppError } from '../../src/http/errors.js';

describe('verifyPaystackSignature', () => {
  it('accepts valid HMAC-SHA512 hex signature', () => {
    const secret = env.PAYSTACK_SECRET_KEY!;
    const raw = Buffer.from(JSON.stringify({ event: 'charge.success' }), 'utf8');
    const sig = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    expect(() => verifyPaystackSignature(raw, sig)).not.toThrow();
  });

  it('rejects wrong signature', () => {
    const raw = Buffer.from('{}', 'utf8');
    expect(() => verifyPaystackSignature(raw, 'not-a-valid-signature-match')).toThrow(AppError);
  });

  it('rejects missing header', () => {
    const raw = Buffer.from('{}', 'utf8');
    expect(() => verifyPaystackSignature(raw, undefined)).toThrow(AppError);
  });
});

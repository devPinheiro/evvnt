import crypto from 'crypto';
import { AppError } from '../../http/errors.js';
import { env } from '../../config/env.js';

export function verifyPaystackSignature(rawBody: Buffer, signatureHeader: string | undefined) {
  const secret = env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new AppError({
      status: 500,
      code: 'PAYMENTS_NOT_CONFIGURED',
      message: 'PAYSTACK_SECRET_KEY is not configured',
    });
  }
  if (!signatureHeader) {
    throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Missing Paystack signature header' });
  }

  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(hash, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid Paystack signature' });
  }
}


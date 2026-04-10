import crypto from 'crypto';

/** SHA-256 for opaque URL tokens (verification + password reset links). */
export function hashOpaqueToken(raw: string) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

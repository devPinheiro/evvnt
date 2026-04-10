import crypto from 'crypto';

export function generateSixDigitCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function normalizeOtpCode(input: string) {
  return input.replace(/\s+/g, '').trim();
}

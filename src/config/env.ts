import { z } from 'zod';

/** Treat unset or blank env as undefined so optional fields work with empty `.env` lines. */
function optNonEmptyString() {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(1).optional(),
  );
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-please-change'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-please-change'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().min(3600).default(60 * 60 * 24 * 14),

  // Paystack
  PAYSTACK_SECRET_KEY: optNonEmptyString(),

  /// Public URL for auth links in emails (verification, password reset). Defaults to localhost API.
  APP_PUBLIC_URL: optNonEmptyString(),

  // Email (SMTP)
  SMTP_HOST: optNonEmptyString(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: optNonEmptyString(),
  SMTP_PASS: optNonEmptyString(),
  EMAIL_FROM: optNonEmptyString(),
  /** If set, `GET /health/smtp` is enabled when request header `x-smtp-probe-secret` matches (SMTP handshake only; no email sent). */
  SMTP_HEALTH_SECRET: optNonEmptyString(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);


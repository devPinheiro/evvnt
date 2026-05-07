import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../../http/errors.js';
import { ok } from '../../http/response.js';
import { AuthService } from './auth.service.js';
import { requireAuth } from './requireAuth.js';
import { prisma } from '../../lib/prisma.js';

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function userPublic(u: {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: Date | null;
  pendingEmail: string | null;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: Boolean(u.emailVerifiedAt),
    pendingEmail: u.pendingEmail,
  };
}

export function buildAuthRouter(authService: AuthService) {
  const router = Router();

  router.post('/signup', async (req, res, next) => {
    try {
      const body = z
        .object({
          orgName: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(8),
          name: z.string().min(1).optional(),
        })
        .parse(req.body);

      const result = await authService.signup(body);
      res.status(201).json(
        ok({
          organisation: { id: result.organisation.id, name: result.organisation.name },
          user: userPublic(result.user),
          tokens: result.tokens,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          password: z.string().min(8),
        })
        .parse(req.body);

      const result = await authService.login(body);
      res.json(
        ok({
          user: userPublic(result.user),
          tokens: result.tokens,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/otp/request', strictLimiter, async (req, res, next) => {
    try {
      const body = z.object({ email: z.string().email() }).parse(req.body);
      await authService.requestLoginOtp(body);
      res.json(ok({ ok: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/otp/verify', strictLimiter, async (req, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          code: z.string().min(4).max(12),
        })
        .parse(req.body);

      const result = await authService.verifyLoginOtp(body);
      res.json(
        ok({
          user: userPublic(result.user),
          tokens: result.tokens,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  router.get('/verify-email', async (req, res, next) => {
    try {
      const token = z.string().min(1).parse(req.query.token);
      await authService.verifyEmailWithToken(token);
      res.json(ok({ verified: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/verify-email', strictLimiter, async (req, res, next) => {
    try {
      const body = z.object({ token: z.string().min(1) }).parse(req.body);
      await authService.verifyEmailWithToken(body.token);
      res.json(ok({ verified: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/verify-email/otp', strictLimiter, async (req, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email(),
          code: z.string().min(4).max(12),
        })
        .parse(req.body);

      await authService.verifyEmailWithOtp(body);
      res.json(ok({ verified: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/verification/resend', strictLimiter, async (req, res, next) => {
    try {
      const body = z.object({ email: z.string().email() }).parse(req.body);
      await authService.resendVerification(body);
      res.json(ok({ ok: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/password/forgot', strictLimiter, async (req, res, next) => {
    try {
      const body = z.object({ email: z.string().email() }).parse(req.body);
      await authService.requestPasswordReset(body);
      res.json(ok({ ok: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/password/reset', strictLimiter, async (req, res, next) => {
    try {
      const body = z
        .object({
          token: z.string().min(1),
          newPassword: z.string().min(8),
        })
        .parse(req.body);

      await authService.resetPassword(body);
      res.json(ok({ ok: true }));
    } catch (err) {
      next(err);
    }
  });

  router.post('/password/change', requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw new Error('Missing auth context');

      const body = z
        .object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(8),
        })
        .parse(req.body);

      await authService.changePassword({
        userId: auth.userId,
        orgId: auth.orgId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
      res.json(ok({ ok: true }));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/me', requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw new Error('Missing auth context');

      const body = z
        .object({
          name: z.string().min(1).nullable().optional(),
          email: z.string().email().optional(),
        })
        .parse(req.body);

      const result = await authService.updateProfile({
        userId: auth.userId,
        orgId: auth.orgId,
        name: body.name,
        email: body.email,
      });

      const u = await prisma.user.findFirst({
        where: { id: result.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerifiedAt: true,
          pendingEmail: true,
          organisationId: true,
          createdAt: true,
        },
      });
      res.json(
        ok({
          user: u
            ? { ...u, emailVerified: Boolean(u.emailVerifiedAt) }
            : null,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
      const result = await authService.refresh(body);
      res.json(ok(result));
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
      const result = await authService.logout(body);
      res.json(ok(result));
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw new Error('Missing auth context');
      const row = await prisma.user.findFirst({
        where: { id: auth.userId, organisationId: auth.orgId },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerifiedAt: true,
          pendingEmail: true,
          organisationId: true,
          createdAt: true,
        },
      });
      if (!row) {
        throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'User not found' });
      }
      res.json(
        ok({
          user: {
            ...row,
            emailVerified: Boolean(row.emailVerifiedAt),
          },
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  return router;
}
